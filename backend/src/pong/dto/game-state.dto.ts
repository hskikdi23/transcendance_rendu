export class Score {
  leftScore: number;
  rightScore: number;
}

export class Item {;
  posx: number;
  posy: number;
}

export class State {
  score: Score
  leftPaddle: Item;
  rightPaddle: Item;
  ball: Item;
  countdown: number;
}

export class GameStateDto {
  id: string;
  state: State;
}
