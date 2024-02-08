import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from 'src/channel/channel.service';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';
import { User } from '@prisma/client';
import { Channel } from '@prisma/client';
import { Post } from '@prisma/client';
import { Muted, WsUser } from 'src/types';
import { PostEmitDto } from './dto/post.dto';
import { ChatRoom } from './types/ChatRoom';
import { Socket } from 'socket.io';

@Injectable()
export class ChatService {

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly channel: ChannelService,
    private readonly posts: PostsService,
  ) {}

  chatUsers: WsUser[] = [];
  muteUsers: Muted[] = [];
  rooms: ChatRoom[] = [];

  async validateUser(authHeader: string) {
    const token = authHeader.split('=')[1];
    return this.auth.validateToken(token)
  }

  async addUser(socketId: string, tokenData: any): Promise<WsUser | undefined> {
    const user: Omit<User, 'password'> | null = await this.users.findById(tokenData.sub);

    if (user !== null) {
      const chatUser: WsUser = { username: user.username, prismaId: user.id, socketId: socketId, lastPing: Date.now()}
      this.chatUsers.push(chatUser)
      return chatUser
    }
  }


  banUser(socketId: string, banUsername: string, channelName: string) {
    const room = this.rooms.find(room => room.id === channelName);
    if (room) {
      const user = room.users.find(user => user.socketId === socketId);
      if (user) {
        const banned = room.users.find(user => user.username === banUsername);
        if (banned) {
          const toDel: number = room.users.indexOf(banned);
          if (toDel !== -1)
            room.users.splice(toDel, 1);
          return banned;
        }
     }
    }
  }

  kickUser(socketId: string, kickUsername: string, channelName: string) {
    const room = this.rooms.find(room => room.id === channelName);
    if (room) {
      const user = room.users.find(user => user.socketId === socketId);
      if (user) {
        const kicked = room.users.find(user => user.username === kickUsername);
        if (kicked) {
          const toDel: number = room.users.indexOf(kicked);
          if (toDel !== -1)
            room.users.splice(toDel, 1);
          return kicked;
        }
      }
    }
  }

  // One username can link to multiple clients (this might/should change)
  removeUser(socketId: string) {
    const user: WsUser | undefined = this.chatUsers.find(chatUser => chatUser.socketId === socketId);
    if (user) {
      const rooms: ChatRoom[] | undefined = this.getUserRooms(user);
      rooms.forEach(room => {
        const toDel = room.users.indexOf(user);
        if (toDel !== -1)
          room.users.splice(toDel, 1);
        if (room.users.length === 0) {
          const toDel = this.rooms.indexOf(room);
          if (toDel !== -1)
            this.rooms.splice(toDel, 1);
        }
      });
    }
    this.chatUsers = this.chatUsers.filter(user => user.socketId !== socketId)
  }

  async retrieveChannelPosts(channelName: string): Promise<PostEmitDto[]> {
    let ret: PostEmitDto[] = [];
    const channel: Channel | null = await this.channel.findByName(channelName);

    if (channel !== null) {
      const posts: Post[] = await this.posts.findByChannel(channel.id);
      for (const post of posts) {
        const author: Omit<User, 'password'> | null = await this.users.findById(post.authorId);
        if (author !== null)
          ret.push({content: post.content, author: author.username, channelName: channelName, date: post.date});
      }
    }
    return ret;
  }

  getUserBySocketId(id: string): WsUser | undefined {
    return this.chatUsers.find(user => user.socketId === id)
  }

  mute(channelName: string, userId: number, seconds: number) {
    this.muteUsers.push({ channelName: channelName, userPrismaId: userId } as Muted)
    const ms: number = seconds * 1000
    setTimeout(() => this.unmute(channelName, userId), ms)
  }

  unmute(channelName: string, userId: number): void {
    this.muteUsers = this.muteUsers.filter((muted: Muted) => muted.channelName !== channelName || muted.userPrismaId !== userId)
  }

  isMutedByPrismaId(id: number): boolean {
    return this.muteUsers.some((muted: Muted) => muted.userPrismaId === id)
  }

  joinRoom(user: WsUser, roomId: string) {
    const room: ChatRoom | undefined = this.rooms.find(room => room.id == roomId);
    if (!room) {
      this.rooms.push({ id: roomId, users: [user]});
    } else {
      room.users.push(user);
    }
  }

  leaveRoom(user: WsUser, roomId: string) {
    const room: ChatRoom | undefined = this.rooms.find(room => room.id == roomId);
    if (room) {
      const toDel: number = room.users.indexOf(user);
      if (toDel !== -1)
        room.users.splice(toDel, 1);
      if (room.users.length === 0) {
        const toDel: number = this.rooms.indexOf(room);
        if (toDel !== -1)
          this.rooms.splice(toDel, 1);
      }
    }
  }

  getRoomUsers(channelName: string) {
    const room: ChatRoom | undefined = this.rooms.find(room => room.id === channelName);
    if (room) {
      return room.users;
    }
  }

  getUserRooms(user: WsUser) {
    let rooms: ChatRoom[] = [];
    this.rooms.forEach(room => {
      if (room.users.find(roomUser => roomUser.prismaId === user.prismaId))
        rooms.push(room);
    });
    return rooms;
  }

  alreadyInRoom(chatUser: WsUser, roomId: string) {
    const room: ChatRoom | undefined = this.rooms.find(room => room.id === roomId);
    if (room) {
      const already = room.users.find(user => user.username === chatUser.username);
      if (already)
        return true;
    }
    return false;
  }

}
