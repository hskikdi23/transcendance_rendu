import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io'
import { ChatService } from './chat.service';
import { PostDto, PostEmitDto } from './dto/post.dto';
import { Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChannelDto } from 'src/channel/dto/channel.dto';
import { ChatGuard } from './chat.guard';
import { WsActionSuccess, WsActionFailure, WsFailureCause, WsHandlerSuccessServerLog, WsHandlerSuccessClientLog, WsLifecycleHookSuccessServerLog, WsLifecycleHookSuccessClientLog, WsLifecycleHookFailureServerLog, WsLifecycleHookFailureClientLog, WsHandlerFailureServerLog, WsHandlerFailureClientLog } from './types/types';
import { BadRequestTransformationFilter } from 'src/filters';
import { ChannelService } from 'src/channel/channel.service';
import { WsUser } from 'src/types';
import { PostsService } from 'src/posts/posts.service';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { DirectMessageService } from './dm.service';
import { UsersService } from 'src/users/users.service';
import { CreateDirectMessage } from './types/CreateDirectMessage';
import { MuteDto } from './dto/mute.dto';
import { Post, User } from '@prisma/client';
import { BanKickDto } from './dto/ban.kick.dto';
import { Channel } from 'diagnostics_channel';

// TODO: extract `user` someway with Guard, Pipe, Interceptor, Middleware, etc. before handlers execution
//       (main difficulty here is that TransformationPipe can't be applied upon @ConnectedSocket instance)

// For the moment, when an event handler succeed, backend returns a string.
// (Yes, this string is typed with something like `WsHandlerSuccessClientLog` but its just a string.)
// In the frontend, this string is retrieved as parameter of the acknowledgement callback function of the corresponding `emit()`.
// In the future, if we decide to return a proper `WsResponse` instead of this simple string,
// note that we will no longer be able to retrieve this return value the same way.
// We will need to define a proper `socket.on()` event listener:
//  - the WsResponse's `event` field will be its first parameter (the event to listen to).
//  - the WsResponse's  `data` field will be the parameter of the callback function (its second parameter).

@WebSocketGateway({
  path: '/chat',
  cors: {
    origin: `${process.env.COMMON_BASE_URL}:8080`,
    credentials: true
  },
})
@UseFilters(BadRequestTransformationFilter)
@UsePipes(ValidationPipe)
@UseGuards(ChatGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger: Logger = new Logger(ChatGateway.name, { timestamp: true })

  constructor(
    private readonly chat: ChatService,
    private readonly posts: PostsService,
    private readonly channel: ChannelService,
    private readonly users: UsersService,
    private readonly dm: DirectMessageService
  ) {}

  @WebSocketServer()
  server: Server

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {

    if (client.handshake.query.dm === "true")
      return;

    // Since `ChatGuard` has been applied we assume `user` is not undefined
    const user: WsUser = this.chat.chatUsers.find(user => user.socketId === client.id) as WsUser

    if (this.chat.alreadyInRoom(user, room))
      return ;

    this.server.to(room).emit('userjoin', { username: user.username, channelName: room });
    this.chat.joinRoom(user, room);
    client.join(room)

    const channelPosts: PostEmitDto[] = await this.chat.retrieveChannelPosts(room)
    for (const post of channelPosts)
      client.emit('post', post)

    return this.eventHandlerSuccess(user, room, WsActionSuccess.JoinRoom)
  }

  @SubscribeMessage('getChanPosts')
  async handleGetChanPosts(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    const channelPosts: PostEmitDto[] = await this.chat.retrieveChannelPosts(room)
      for (const post of channelPosts)
        client.emit('post', post)
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    if (client.handshake.query.dm === "true")
      return;

    // Since `ChatGuard` has been applied we assume `user` is not undefined
    const user: WsUser = this.chat.chatUsers.find(user => user.socketId === client.id) as WsUser

    client.leave(room)
    this.chat.leaveRoom(user, room);
    this.server.to(room).emit('userleave', {username: user.username, channelName: room});

    return this.eventHandlerSuccess(user, room, WsActionSuccess.LeaveRoom)
  }

  @SubscribeMessage('ban')
  async handleBan(@ConnectedSocket() client: Socket, @MessageBody() ban: BanKickDto) {
    if (client.handshake.query.dm === "true")
      return;
    const banned: WsUser | undefined = this.chat.banUser(client.id, ban.username, ban.channelName);
    if (banned) {
      this.server.to(ban.channelName).emit('userban', { channelName: ban.channelName, username: banned.username });
      const roomSockets = await this.server.in(ban.channelName).fetchSockets();
      const bannedSocket = roomSockets.find(socket => socket.handshake.query.username === ban.username)
      bannedSocket?.leave(ban.channelName)
    }
  }

  @SubscribeMessage('kick')
  async handleKick(@ConnectedSocket() client: Socket, @MessageBody() kick: BanKickDto) {
    if (client.handshake.query.dm === "true")
      return;
    const kicked: WsUser | undefined = this.chat.kickUser(client.id, kick.username, kick.channelName);
    if (kicked) {
      this.server.to(kick.channelName).emit('userkick', { channelName: kick.channelName, username: kicked.username });
      const roomSockets = await this.server.in(kick.channelName).fetchSockets();
      const bannedSocket = roomSockets.find(socket => socket.handshake.query.username === kick.username)
      bannedSocket?.leave(kick.channelName)
    }
  }

  @SubscribeMessage('sendPost')
  async handlePost(@ConnectedSocket() client: Socket, @MessageBody() post: PostDto) {
    if (client.handshake.query.dm === "true")
      return;

    // Since `ChatGuard` has been applied we assume `user` is not undefined
    const user: WsUser = this.chat.chatUsers.find(user => user.socketId === client.id) as WsUser

    // Since `ChatGuard` has been applied we assume the channel exists
    const channelId: number = (await this.channel.findByName(post.channelName))?.id as number

    // Check if user is muted
    if (this.chat.isMutedByPrismaId(user.prismaId) === true)
      return this.eventHandlerFailure(user, post.channelName, WsActionFailure.Post, WsFailureCause.UserMuted)

    // TODO (?): try/catch
    const _post = await this.posts.create({ content: post.content, channelId: channelId, authorId: user.prismaId })

    const recipients = this.chat.getRoomUsers(post.channelName);
    if (recipients) {
      recipients.forEach(recipient => {
        this.sendPost(recipient, user, post, _post);
      });
    }

    return this.eventHandlerSuccess(user, post.channelName, WsActionSuccess.Post)
  }

  async sendPost(recipient: WsUser, user: WsUser, post: PostDto, _post: Post) {
    const blocked = await this.users.isBlocked(recipient.prismaId, user.username);
    if (blocked === false) {
      this.server.to(recipient.socketId).emit('post', {
      channelName: post.channelName,
      content: post.content,
      author: user.username,
      date: _post.date
      } as PostEmitDto)
    }
  }

  @SubscribeMessage('sendDirectMessage')
  async handleSendDirectMessage(@ConnectedSocket() client: Socket, @MessageBody() message: SendDirectMessageDto) {

    if (client.handshake.query.dm === "false")
      return;

    // Since `ChatGuard` has been applied we assume `user` is not undefined
    const sender: WsUser = this.chat.chatUsers.find(user => user.socketId === client.id) as WsUser

    // TODO: add `UserByNamePipe` into `DirectMessageDto` (would lead to delete `this.userService`)
    const recipient: any = await this.users.findByUsername(message.recipient)
    if (!recipient) {
      this.server.to(client.id).emit('changeName');
      return ;
    }

    const blocked = await this.users.isBlocked(recipient.id, sender.username);
    if (blocked) {
      this.server.to(client.id).emit('blocked')
      return;
    }

    // db
    const dm = await this.dm.create({
      content: message.content,
      senderId: sender.prismaId,
      receiverId: recipient.id
    } as CreateDirectMessage)

    // emit to recipient if connected
    // since we can't distinguish the dm socket from the online status socket of the recipient we emit to both (yes, this is ugly)
    const _recipient: WsUser[] | undefined = this.chat.chatUsers.filter(user => user.username === message.recipient)
    if (_recipient !== undefined)
      _recipient.forEach(r => this.server.to(r.socketId).emit('dm', message.content, sender.username, dm.date))

    // emit to sender so he doesn't need to refresh the page to see the message
    this.server.to(client.id).emit('dm', message.content, sender.username, dm.date)

    return this.eventHandlerSuccess(sender, message.recipient, WsActionSuccess.DirectMessage)
  }

  // TODO: log must precise from which channel user has been muted
  @SubscribeMessage('mute')
  async handleMute(@ConnectedSocket() client: Socket, @MessageBody() body: MuteDto) {
    if (client.handshake.query.dm === "true")
      return;

    // Since `ChatGuard` has been applied we assume `user` is not undefined
    const user: WsUser = this.chat.chatUsers.find(user => user.socketId === client.id) as WsUser

    const mutedUser: Omit<User, 'password'> | null = await this.users.findById(body.userId)

    if (mutedUser === null)
      return this.eventHandlerFailure(user, '', WsActionFailure.Mute, WsFailureCause.UserNotFound)

    // Only admins can mute
    if (await this.channel.isAdmin(body.channelName, user.prismaId) === false)
      return this.eventHandlerFailure(user, mutedUser.username, WsActionFailure.Mute, WsFailureCause.UserNotAdmin)

    // Check if user already muted
    if (this.chat.isMutedByPrismaId(body.userId) === true)
      return this.eventHandlerFailure(user, mutedUser.username, WsActionFailure.Mute, WsFailureCause.UserAlreadyMuted)

    this.chat.mute(body.channelName, body.userId, body.seconds)
    return this.eventHandlerSuccess(user, mutedUser.username, WsActionSuccess.Mute)
  }

  afterInit() {
    this.logger.log(WsActionSuccess.Init)
  }

  // guard can't be applied here
  // see https://github.com/nestjs/nest/issues/882
  async handleConnection(@ConnectedSocket() client: Socket) {

    const authHeader: string | undefined = client.request.headers.cookie

    if (authHeader === undefined)
      return this.lifecycleHookFailure(client.id, WsActionFailure.Connect, WsFailureCause.AuthCookieNotFound)

    const tokenData: any = await this.chat.validateUser(authHeader)
    const user: WsUser | undefined = await this.chat.addUser(client.id, tokenData)

    if (user === undefined)
      return this.lifecycleHookFailure(client.id, WsActionFailure.Connect, WsFailureCause.UserNotFound)

    if (client.handshake.query.dm === "false") {
      const userChannels = await this.channel.findUserChannel(user.prismaId);
      const channelNames = userChannels.map(channel => channel.name);
      channelNames.forEach(roomName => {
        // this.server.to(roomName).emit('userjoin', { username: user.username, channelName: roomName});
        this.chat.joinRoom(user, roomName);
        client.join(roomName);
      });
    }

    return this.lifecycleHookSuccess(user, WsActionSuccess.Connect)
  }


  // guard can't be applied here
  // see https://github.com/nestjs/nest/issues/882
  async handleDisconnect(@ConnectedSocket() client: Socket) {

    const user: WsUser | undefined = this.chat.getUserBySocketId(client.id)

    if (user === undefined)
      return this.lifecycleHookFailure(client.id, WsActionFailure.Disconnect, WsFailureCause.UserNotFound)

    if (client.handshake.query.dm === "false") {
      const userRooms = this.chat.getUserRooms(user);
      const roomNames = userRooms.map(userRoom => userRoom.id);
      roomNames.forEach(room => {
        // this.server.to(room).emit('userleave', {username: user.username, channelName: room});
        client.leave(room);
        this.chat.leaveRoom(user, room);
      });
    }

    this.chat.removeUser(user.socketId)

    return this.lifecycleHookSuccess(user, WsActionSuccess.Disconnect)
  }

  eventHandlerSuccess(sender: WsUser, recipient: string, action: WsActionSuccess) {
    this.logger.log(`client ${sender.socketId} (user ${sender.username}) ${action} ${recipient}` as WsHandlerSuccessServerLog)
    return `${action} ${recipient}` as WsHandlerSuccessClientLog
  }

  eventHandlerFailure(sender: WsUser, recipient: string, action: WsActionFailure, cause: WsFailureCause) {
    this.logger.warn(`client ${sender.socketId} (user ${sender.username}) ${action} ${recipient}: ${cause}` as WsHandlerFailureServerLog)
    throw new WsException(`${action} ${recipient}: ${cause}` as WsHandlerFailureClientLog)
  }

  lifecycleHookFailure(id: string, action: WsActionFailure, cause: WsFailureCause) {
    this.logger.warn(`client ${id} ${action}: ${cause}` as WsLifecycleHookFailureServerLog)
    throw new WsException(`${action}: ${cause}` as WsLifecycleHookFailureClientLog)
  }

  lifecycleHookSuccess(user: WsUser, action: WsActionSuccess) {
    this.logger.log(`client ${user.socketId} (user ${user.username}) ${action}` as WsLifecycleHookSuccessServerLog)
    return action as WsLifecycleHookSuccessClientLog
  }

}
