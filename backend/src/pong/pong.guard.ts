import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Socket } from 'socket.io'
import { PongService } from "./pong.service";
import { WsUser } from "src/types";
import { UsersService } from "src/users/users.service";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class PongGuard implements CanActivate {

  constructor(
    private readonly pong: PongService,
    private readonly users: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const handler: string = context.getHandler().name
    const client: Socket = context.switchToWs().getClient<Socket>()
    const user: WsUser | undefined = this.pong.getUserBySocketId(client.id)

    if (user === undefined) { return false }

    if (handler === 'handleRequestGame') {

      const friend: string | undefined = context.getArgs().at(1)?.friend

      // random game
      if (friend === undefined) { return true }

      const isBlocked: boolean = await this.users.isBlocked(user.prismaId, friend)
      if (isBlocked === true)
        throw new WsException('cannot invite someone that you blocked')

      const isBlockedBy: boolean = await this.users.isBlockedBy(user.prismaId, friend)
      if (isBlockedBy === true)
        throw new WsException('cannot invite someone that blocked you')

    }

    return true
  }
}