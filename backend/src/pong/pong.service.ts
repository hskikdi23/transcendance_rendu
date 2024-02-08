import { Injectable } from '@nestjs/common';
import { Game } from './game/Game';
import { User } from '@prisma/client';
import { Room } from './types/Room';
import { Settings } from './types/Settings';
import { WsUser } from 'src/types';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { MatchsService } from 'src/matchs/matchs.service';
import { GameStateDto } from './dto/game-state.dto';
import { GameDto } from './dto/game.dto';
import { RoomDto } from './dto/room.dto';
import { RequestGameDto } from './dto/request-game.dto';
import { Socket } from 'socket.io';

@Injectable()
export class PongService {

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly matchs: MatchsService
  ) {}

  rooms: Room[] = [];
  pongUsers: WsUser[] = [];

  async validateUser(authHeader: string) {
    const token = authHeader.split('=')[1];
    return this.auth.validateToken(token)
  }

   async addUser(socketId: string, tokenData: any) {
    const user: Omit<User, 'password'> | null = await this.users.findById(tokenData.sub);
    if (user !== null) {
      this.pongUsers.push({username: user!.username, prismaId: user!.id, socketId: socketId , lastPing: Date.now()})
      return user.username;
    }
  }

  async reconnectUser(socketId: string, tokenData: any): Promise<string | undefined> {
    const user: Omit<User, 'password'> | null = await this.users.findById(tokenData.sub);

    if (user) {
      const wsUser = this.getUserById(user.id);
      if (wsUser) {
        wsUser.socketId = socketId;
        wsUser.lastPing = Date.now();
        const room: Room | undefined = this.rooms.find(room => room.disconnected?.user.prismaId === wsUser.prismaId);
        if (room) {
          delete(room.disconnected);
          room.game.unPause();
          return (room.id);
        }
      }
    }
  }

  async disconnectUser(socketId: string): Promise<string | undefined> {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user !== undefined) {
      const room : string | undefined = await this.removeUserFromRoom(user);
      return room;
    }
    return undefined;
  }

  handleRequestGame(socketId: string, friend: string | undefined, settings: Settings): string | undefined {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user !== undefined) {
      if (friend !== undefined) {
        const room : Room | undefined = this.rooms.find(room => room.player1.username === friend);
        if (room !== undefined) {
          room.player2 = user;
          room.start = true;
          return room.id;
        }
        else
          this.rooms.push({ id: user.username, player1: user, player2: undefined, game: new Game(600, 400, settings), watchers: [], start: false, ranked: false, settings: settings  });
        return undefined;
      } else {
        const room : Room | undefined = this.rooms.find(room => room.player2 === undefined && room.ranked === true && JSON.stringify(room.settings) === JSON.stringify(settings));
        if (room !== undefined) {
          room.player2 = user;
          room.start = true;
          return room.id;
        }
        else
          this.rooms.push({ id: user.username, player1: user, player2: undefined, game: new Game(600, 400, settings), watchers: [], start: false, ranked: true, settings: settings});
        return undefined;
      }
    }
    return undefined;
  }

  cancelRequest(socketId: string) {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user !== undefined) {
      const room: Room | undefined = this.rooms.find(room => room.player1 === user);
      if (room !== undefined) {
          const toDelete: number = this.rooms.indexOf(room);
          this.rooms.splice(toDelete, 1);
      }
    }
  }

  gameAlreadyRequested(socketId: string) {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user !== undefined) {
      const room: Room | undefined = this.rooms.find(room => room.player1.prismaId === user.prismaId);
      if (room !== undefined) {
        return true;
      }
    }
    return false;
  }

  handleWatchGame(socketId: string, game: GameDto): string | undefined {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)
    const room: Room | undefined = this.getRoomById(game.gameName)

    if (room !== undefined && user !== undefined) {
      room.watchers.push(user);
      return room.id;
    }
    return undefined;
  }

  private async removeUserFromRoom(user: WsUser): Promise<string | undefined> {
    const room: Room | undefined = this.rooms.find(room => room.player1 === user || room.player2 === user);
    if (room !== undefined) {
      if (room.start === true) {
        await this.registerMatch(room, user);
        const toDelete: number = this.rooms.indexOf(room)
        this.rooms.splice(toDelete, 1);
      }
      return room.id ;
    }
    return undefined;
  }

  private async registerMatch(room: Room, loser: WsUser) {
    if (room.ranked)
      await this.updateMmr(room, loser);
    if (loser === room.player1) {
      await this.matchs.create({ winnerId: room.player2!.prismaId,
                                      winnerScore: room.game.rightScore,
                                      loserId: loser.prismaId,
                                      loserScore: room.game.leftScore,
                                      ranked: room.ranked })
    } else {
      await this.matchs.create({ winnerId: room.player1.prismaId,
                                      winnerScore: room.game.leftScore,
                                      loserId: loser.prismaId,
                                      loserScore: room.game.rightScore,
                                      ranked: room.ranked })
    }
  }

  getGamesState(): GameStateDto[] {
    const gamesStateDto: GameStateDto[] = [];
    this.rooms.forEach(room => {
      if (room.start === true) {
        const result = room.game.loop();
        gamesStateDto.push({ id: room.id, state: room.game.getState() });
        if (JSON.stringify(result) !== '{}')
         this.endMatch(room);
      }
    });
    return gamesStateDto;
  }

  getRoomList(): RoomDto[] {
    let roomList: RoomDto[] = [];

    this.rooms.forEach(room => {
      if (room.start === true)
        roomList.push({roomId: room.id, player1: room.player1.username, player2: room.player2!.username});
    });
    return roomList;
  }

  async endMatch(room: Room) {
    room.start = false;
    if (room.game.getState().score.leftScore === 10)
      await this.registerMatch(room, room.player2!);
    else
      await this.registerMatch(room, room.player1);
    const toDelete: number = this.rooms.indexOf(room);
    this.rooms.splice(toDelete, 1);
  }

  handleControls(socketId: string, pressed: boolean, key: string) {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)
    const room: Room | undefined = this.rooms.find(room => room.player1 === user || room.player2 === user);

    if (room !== undefined) {
      if (key === 'w' || key === 'ArrowUp') {
        if (room.player1 === user) {
          if (pressed === true)
            room.game.leftPaddle.moveUp();
          else
            room.game.leftPaddle.stop();
        } else {
          if (pressed === true)
            room.game.rightPaddle.moveUp();
          else
            room.game.rightPaddle.stop();
        }
      }
      if (key === 's' || key === 'ArrowDown') {
        if (room.player1 === user) {
          if (pressed === true)
            room.game.leftPaddle.moveDown();
          else
            room.game.leftPaddle.stop();
        } else {
          if (pressed === true)
            room.game.rightPaddle.moveDown();
          else
            room.game.rightPaddle.stop();
        }
      }
    }
  }

  getWinner(roomId: string): string {
    const room: Room | undefined = this.getRoomById(roomId)
    if (room !== undefined) {
      if (room.game.leftScore === 10)
        return room.player1.socketId;
      else
        return room.player2!.socketId;
    }
    return '';
  }

  getLoser(roomId: string): string {
    const room: Room | undefined = this.getRoomById(roomId)
    if (room !== undefined) {
      if (room.game.leftScore === 10)
        return room.player2!.socketId;
      else
        return room.player1.socketId;
    }
    return '';
  }

  getUsername(socketId: string): string | undefined {
    return this.pongUsers.find(user => user.socketId === socketId)?.username
  }

  getUserBySocketId(id: string) {
    return this.pongUsers.find(user => user.socketId === id)
  }

  private getRoomById(id: string) {
    return this.rooms.find(room => room.id === id)
  }

  getRoomPlayers(roomId: string): { player1: string; player2: string } | undefined {
    const room: Room | undefined = this.rooms.find(room => room.id === roomId)
    if (room !== undefined && room.player2 !== undefined) {
      return { player1: room.player1.username, player2: room.player2.username }
    }
  }

  getRoomSettings(roomId: string): Settings | undefined {
    return this.rooms.find(room => room.id === roomId)?.settings
  }

  removeRoom(roomId: string) {
    const room: Room | undefined = this.getRoomById(roomId)
    if (room !== undefined) {
      const toDelete: number = this.rooms.indexOf(room);
      this.rooms.splice(toDelete, 1);
    }
  }

  removeUser(clientId: string) {
    const user: WsUser | undefined = this.getUserBySocketId(clientId);
    if (user) {
      const toDelete: number = this.pongUsers.indexOf(user);
      this.pongUsers.splice(toDelete, 1);
    }
  }

  private async updateMmr(room: Room, loserWsUser: WsUser) {
    const loser: Omit<User, 'password'> | null = await this.users.findById(loserWsUser.prismaId);
    let winnerId: number;
    if (loser && loser.id == room.player1.prismaId)
      winnerId = room.player2!.prismaId
    else
      winnerId = room.player1.prismaId
    const winner: Omit<User, 'password'> | null  = await this.users.findById(winnerId);

    if (loser !== null && winner !== null) {
      const R1: number = 10 ** (loser.mmr / 400);
      const R2: number = 10 ** (winner.mmr / 400);

      const E1: number = R1 / (R1 + R2);
      const E2: number = R2 / (R1 + R2);

      const loserMmr = Math.round(loser.mmr + 32 * (0 - E1));
      const winnerMmr = Math.round(winner.mmr + 32 * (1 - E2));

      await this.users.updateGameStats(loser.username, loser.games + 1, loserMmr);
      await this.users.updateGameStats(winner.username, winner.games + 1, winnerMmr);
    }
  }

  getUserById(prismaId: number) {
    return this.pongUsers.find(user => user.prismaId === prismaId);
  }


  isLagging(socketId: string) {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user) {
      if (Date.now() - user.lastPing > 4000) {
        user.lastPing = Date.now();
        return true
      }
      user.lastPing = Date.now();
    }
    return false
  }

  tempDisconnect(socketId: string) : boolean{
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user) {
      const room: Room | undefined = this.rooms.find(room => room.player1 === user || room.player2 === user);
      if (room) {
        room.disconnected = {user: user, time: Date.now()};
        return true;
      }
    }

    return false;
  }

  pauseGame(socketId: string) {
    const user: WsUser | undefined = this.getUserBySocketId(socketId)

    if (user) {
      const room: Room | undefined = this.rooms.find(room => room.player1 === user || room.player2 === user);
      if (room && room.start == true) {
        room.game.pause(15);
      }
    }
  }

  isTimeout(roomId: string) {
    const room: Room | undefined = this.rooms.find(room => room.id == roomId);

    if (room) {
      if (room.disconnected)
        if (room.game.countdown === 0) {
          return room.disconnected.user.socketId;
        }
    }
  }

  isPaused(roomId: string) {
    const room: Room | undefined = this.rooms.find(room => room.id == roomId);
    if (room && room.disconnected) {
      return true;
    }
    return false;
  }

  getRoomId(clientId: string) {
    const room: Room | undefined = this.rooms.find(room => room.player1.socketId === clientId || room.player2?.socketId === clientId);
    if (room)
      return room.id;
  }

  getRemainingId(roomId: string) {
    const room: Room | undefined = this.rooms.find(room => room.id == roomId);

    if (room && room.disconnected) {
      if (room.disconnected.user.socketId === room.player1.socketId && room.player2)
        return room.player2.socketId;
      else
        return room.player1.socketId;
    }
  }

  checkSettings(requestGameDto: RequestGameDto) {
    const settings = requestGameDto.settings;

    if (settings.ballSize < 0.5 || settings.ballSize > 2
        || settings.ballSpeed < 0.5 || settings.ballSpeed > 3
      || settings.paddleSize < 0.5 || settings.paddleSize > 2
      || settings.paddleSpeed < 0.5 || settings.paddleSpeed > 2)
      return false;
  return true;
  }
}
