import { Socket } from "socket.io";

export type WsUser = {
  prismaId: number;
  socketId: string;
  username: string;
  lastPing: number;
}

export const enum Status {
  offline,
  online,
  ingame,
}

export type UserStatus = WsUser & {
  status: Status
}

export type Muted = {
  channelName: string
  userPrismaId: number
}
