import type { Settings } from "./Class";

  export class Frame {
    width: number;
    height: number;

    constructor(w: number, h:number) {
      this.width = w;
      this.height = h;
    }

  };

  export class Ball {
    frame: Frame;
    posx: number;
    posy: number;
    radius: number;

    constructor(frame: Frame, settings: Settings) {
      this.frame = frame;
      this.posx = frame.width / 2;
      this.posy = frame.height / 2 ;
      this.radius = frame.width * settings.ballSize / 50;
    }
  }


  export class Paddle {
    frame: Frame;
    left: boolean;
    posx: number;
    posy: number;
    height: number;
    width: number;

    constructor(left: boolean, frame: Frame, settings: Settings) {
      this.frame = frame;
      this.height = frame.height * settings.paddleSize / 5;
      this.width = frame.width / 50;
      if (left) {
        this.posx = 0.01 * frame.width;
      } else {
        this.posx = frame.width - this.width - 0.01 * frame.width;
      }
      this.posy = frame.height / 2 - this.height / 2;
    }
  };
