import { Game } from '../game/Game';
import { WsUser } from 'src/types';
import { Settings } from './Settings';

export type Room = {
  id: string;
  game: Game;
  player1: WsUser;
  player2: WsUser | undefined;
  watchers: WsUser[];
  start: boolean;
  ranked: boolean;
  settings: Settings;

  disconnected?: { user: WsUser, time: number  };
}
