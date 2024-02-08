import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Socket } from 'socket.io'
import { ChatService } from "./chat.service";
import { ChannelDto } from "src/channel/dto/channel.dto";
import { PostDto } from "./dto/post.dto";
import { WsException } from "@nestjs/websockets";
import { WsActionFailure, WsFailureCause, WsHandlerFailureServerLog, WsHandlerFailureClientLog, WsLifecycleHookFailureServerLog, WsLifecycleHookFailureClientLog } from "./types/types"
import { ChannelService } from "src/channel/channel.service";
import { WsUser } from 'src/types';
import { SendDirectMessageDto } from "./dto/send-direct-message.dto";
import { UsersService } from "src/users/users.service";

@Injectable()
export class ChatGuard implements CanActivate {

  private readonly logger: Logger = new Logger(ChatGuard.name, { timestamp: true })

  constructor(
    private readonly chat: ChatService,
    private readonly channel: ChannelService,
    private readonly users: UsersService
  ) {}

  // yes, the exact same function is also defined into `chat.gateway.ts`
  eventHandlerFailure(user: WsUser, channel: string, action: WsActionFailure, cause: WsFailureCause) {
    this.logger.warn(`client ${user.socketId} (user ${user.username}) ${action} ${channel}: ${cause}` as WsHandlerFailureServerLog)
    throw new WsException(`${action} ${channel}: ${cause}` as WsHandlerFailureClientLog)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const handler: string = context.getHandler().name
    const client: Socket = context.switchToWs().getClient<Socket>()
    const user: WsUser | undefined = this.chat.getUserBySocketId(client.id)

    // yes, this is a `lifecycleHookFailure()` doppelganger even if we not into a lifecycle hook
    if (user === undefined) {
      this.logger.warn(`client ${client.id} ${WsActionFailure.Connect}: ${WsFailureCause.UserNotFound}` as WsLifecycleHookFailureServerLog)
      throw new WsException(`${WsActionFailure.Connect}: ${WsFailureCause.UserNotFound}` as WsLifecycleHookFailureClientLog)
    }

    if (handler === 'handleJoinChannel') {

      // verify channel existence
      const channel: ChannelDto = context.getArgByIndex(1)
      if (await this.channel.findByName(channel.channelName) === null)
        this.eventHandlerFailure(user, channel.channelName, WsActionFailure.JoinChannel, WsFailureCause.ChannelNotFound)

      // verify channel membership
      const isInChannel: boolean = await this.channel.isInChannel(channel.channelName, user.prismaId)
      if (isInChannel === true)
        this.eventHandlerFailure(user, channel.channelName, WsActionFailure.JoinChannel, WsFailureCause.UserAlreadyJoined)

      // verify channel password
      else if (channel.status === 'Protected') {
        if (await this.channel.verifyPassword(channel.channelName, channel.password) === false) {
          this.eventHandlerFailure(user, channel.channelName, WsActionFailure.JoinChannel, WsFailureCause.WrongChannelPassword)
        }
      }

      // TODO
      else if (channel.status === 'Private') {
        if (await this.channel.isOwner(channel.channelName, user.prismaId) === false) {
          this.eventHandlerFailure(user, channel.channelName, WsActionFailure.JoinChannel, WsFailureCause.PrivateChannel)
        }
      }
    }

    else if (handler === 'handleJoinRoom') {

      // verify channel existence
      const room: string = context.getArgByIndex(1)
      if (await this.channel.findByName(room) === null)
        this.eventHandlerFailure(user, room, WsActionFailure.JoinRoom, WsFailureCause.ChannelNotFound)

      // verify channel membership
      const isInChannel: boolean = await this.channel.isInChannel(room, user.prismaId)
      if (isInChannel === false)
        this.eventHandlerFailure(user, room, WsActionFailure.JoinRoom, WsFailureCause.UserNotInChannel)
    }

    else if (handler === 'handleLeaveChannel') {

      // verify channel existence
      const channel: string = context.getArgByIndex(1)
      if (await this.channel.findByName(channel) === null)
        this.eventHandlerFailure(user, channel, WsActionFailure.LeaveChannel, WsFailureCause.ChannelNotFound)

      // verify channel membership
      const isInChannel: boolean = await this.channel.isInChannel(channel, user.prismaId)
      if (isInChannel === false)
        this.eventHandlerFailure(user, channel, WsActionFailure.LeaveChannel, WsFailureCause.UserNotInChannel)
    }

    else if (handler === 'sendPost') {

      // verify channel existence
      const post: PostDto = context.getArgByIndex(1)
      if (await this.channel.findByName(post.channelName) === null)
        this.eventHandlerFailure(user, post.channelName, WsActionFailure.Post, WsFailureCause.ChannelNotFound)

      // verify channel membership
      const isInChannel: boolean = await this.channel.isInChannel(post.channelName, user.prismaId)
      if (isInChannel === false)
        this.eventHandlerFailure(user, post.channelName, WsActionFailure.Post, WsFailureCause.UserNotInChannel)
    }

    else if (handler === 'sendDirectMessage') {

      // verify recipient user existence
      const message: SendDirectMessageDto = context.getArgByIndex(1)
      if (await this.users.findByUsername(message.recipient) === null)
        this.eventHandlerFailure(user, message.recipient, WsActionFailure.DirectMessage, WsFailureCause.UserNotFound)
    }

    return true
  }

}