import { OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { PongService } from './pong.service';
import { Socket, Server } from 'socket.io'
import { Interval } from '@nestjs/schedule';
import { KeyEventDto } from './dto/key-event.dto';
import { RequestGameDto } from './dto/request-game.dto';
import { GameStateDto } from './dto/game-state.dto';
import { GameDto } from './dto/game.dto';
import { RoomDto } from './dto/room.dto';
import { UseFilters, UseGuards } from '@nestjs/common';
import { PongGuard } from './pong.guard';
import { BadRequestTransformationFilter } from 'src/filters';

@WebSocketGateway({
  path: '/pong',
  cors: {
    origin: `${process.env.COMMON_BASE_URL}:8080`,
    credentials: true
  },
})
@UseFilters(BadRequestTransformationFilter)
@UseGuards(PongGuard)
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {

  constructor(private readonly pong: PongService) {}

  @WebSocketServer() server: Server;

   @SubscribeMessage('ping')
   handlePing(client: Socket) {
     if (this.pong.isLagging(client.id)) {
       this.pong.pauseGame(client.id);
     }
  }

  @SubscribeMessage('requestGame')
  handleRequestGame(client: Socket, requestGameDto: RequestGameDto) {
    if (!this.pong.checkSettings(requestGameDto)) {
      this.server.to(client.id).emit('badSettings');
      return ;
    }
    if (this.pong.gameAlreadyRequested(client.id)) {
      this.server.to(client.id).emit('alreadyRequested', {});
      return ;
    }

    const room: string | undefined = this.pong.handleRequestGame(client.id, requestGameDto.friend, requestGameDto.settings);
    if (room === undefined) {
      const username: string | undefined = this.pong.getUsername(client.id);
      if (username !== undefined) {
        client.join(username);
        return ;
      }
    } else {
      client.join(room);
      const players = this.pong.getRoomPlayers(room);
      this.server.to(room).emit('gameStart', players);
    }
  }

  @SubscribeMessage('cancelRequest')
  handleCancel(client: Socket) {
    this.pong.cancelRequest(client.id);
  }

  @SubscribeMessage('control')
  handleControls(client: Socket, keyEventDto: KeyEventDto) {
    this.pong.handleControls(client.id, keyEventDto.press, keyEventDto.key);
  }

  @SubscribeMessage('watchGame')
  handleWatchGame(client: Socket, game: GameDto) {
    const room: string | undefined = this.pong.handleWatchGame(client.id, game);
    if (room !== undefined) {
      client.join(room);
      const players = this.pong.getRoomPlayers(room);
      const settings = this.pong.getRoomSettings(room);
      this.server.to(client.id).emit('watchGame', { response: true , players: players, settings: settings});
    } else {
      this.server.to(client.id).emit('watchGame', { response: false });
    }
  }

  @Interval(1000 / 120)
  sendGameState() {
    const gamesState: GameStateDto[] = this.pong.getGamesState();
    gamesState.forEach(game => {
      const clientId: string | undefined = this.pong.isTimeout(game.id);
      if (clientId) {
        const username = this.pong.getUsername(clientId);
        this.server.to(game.id).emit('opponentLeft', {username: username});
        this.pong.disconnectUser(clientId);
        this.pong.removeUser(clientId);
      } else {
        if (this.pong.isPaused(game.id)) {
          const clientId = this.pong.getRemainingId(game.id);
          if (clientId)
            this.server.to(clientId).emit('gameState', game.state);
        } else {
          this.server.to(game.id).emit('gameState', game.state);
          if (game.state.score.leftScore === 10 || game.state.score.rightScore === 10) {
            const winnerId: string = this.pong.getWinner(game.id);
            this.server.to(winnerId).emit('win', {});
            const username: string | undefined = this.pong.getUsername(winnerId);
            this.server.to(game.id).emit('endWatch', {username: username});
            const loserId: string = this.pong.getLoser(game.id);
            this.server.to(loserId).emit('lose', {});
          }
        }
      }
    });
  }

  async handleConnection(client: Socket) {
    const authHeader: string | undefined = client.request.headers.cookie;

    if (authHeader === undefined) {
      this.server.to(client.id).emit('unauthorized', { user: client.id });
    } else {
      const tokenData = await this.pong.validateUser(authHeader);
      const roomId = await this.pong.reconnectUser(client.id, tokenData);
      if (roomId) {
        client.join(roomId);
        const players = this.pong.getRoomPlayers(roomId);
        this.server.to(roomId).emit('unPause', players);
      } else {
        const username: string | undefined = await this.pong.addUser(client.id, tokenData);
        if (username === undefined) {
          this.server.to(client.id).emit('unauthorized', { user: client.id });
        } else {
          this.server.to(client.id).emit('welcome', { user: client.id });
          const roomList : RoomDto[] = this.pong.getRoomList();
          this.server.to(client.id).emit('gameList', { gameList: roomList });
        }
      }
    }
  }

  async handleDisconnect(client: Socket) {

    const room: string | undefined = this.pong.getRoomId(client.id);
    if (room) {
      if (this.pong.isPaused(room)) {
        client.leave(room);
        client.disconnect();
        this.server.to(room).emit('bothLeft');
        this.pong.removeRoom(room);
        this.pong.removeUser(client.id);
      } else if (this.pong.tempDisconnect(client.id)) {
        const username = this.pong.getUsername(client.id);
        this.pong.pauseGame(client.id);
        client.leave(room);
        client.disconnect();
        console.log(username, ' has paused the game');
        this.server.to(room).emit('pause', {username: username});
      }
    }
  }
}
