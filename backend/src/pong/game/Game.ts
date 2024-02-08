import { Settings } from '../types/Settings';
import { Paddle, Ball, Frame } from './Objects'

export class Game {
  frame: Frame;
  settings: Settings;
  ball: Ball;
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  stop: boolean;
  leftScore: number;
  rightScore: number;
  countdown: number;

  constructor (width: number, height: number, settings: Settings){
    this.frame = new Frame(width, height);
    this.settings = settings;

    this.leftPaddle = new Paddle(true, this.frame, this.settings);
    this.rightPaddle = new Paddle(false, this.frame, this.settings);

    this.ball = new Ball(this.frame, this.settings);

    this.stop = false;
    this.leftScore = 0;
    this.rightScore = 0;

    this.countdown = 400;
  }

  pause(time: number) {
    this.countdown = time * 100;
  }

  unPause() {
    this.countdown = 400;
  }

  loop() {
    if (this.countdown != 0) {
      this.countdown -= 1;
      return ({});
    }
      this.leftPaddle.updatePos();
      this.rightPaddle.updatePos();
      this.handleCollision();
      if (this.stop === false) {
        this.ball.updatePos();
      }

      if (this.ball.posx - this.ball.radius <= 0
        || this.ball.posx + this.ball.radius >= this.frame.width) {
        this.updateScore();
        this.ball.reset();
        this.countdown = 400;
      }
      if (this.leftScore === 10 || this.rightScore === 10) {
        return ({
          leftScore: this.leftScore,
          rightScore: this.rightScore
        });
      } else {
          return ({});
      }
  }

  updateScore() {
    if (this.ball.posx - this.ball.radius <= 0) {
      this.rightScore += 1;
    } else {
      this.leftScore += 1;
    }
  }

  handleCollision() {
    if (this.checkCollision(this.rightPaddle) === true) {
      this.ball.bouncePaddle(this.rightPaddle)
    }

    if (this.checkCollision(this.leftPaddle) === true) {
      this.ball.bouncePaddle(this.leftPaddle)
    }
  }

  checkCollision(paddle: Paddle): boolean {
    if (this.ball.posx + this.ball.radius < paddle.posx
      || this.ball.posx - this.ball.radius > paddle.posx + paddle.width
      || this.ball.posy + this.ball.radius < paddle.posy
      || this.ball.posy - this.ball.radius > paddle.posy + paddle.height) {
      return false;
    } else {
      return true;
    }
  }

  getState() {
    return {
      score: {
        leftScore: this.leftScore,
        rightScore: this.rightScore,
      },
      leftPaddle: {
        posx: this.leftPaddle.posx,
        posy: this.leftPaddle.posy,
      },
      rightPaddle: {
        posx: this.rightPaddle.posx,
        posy: this.rightPaddle.posy,
      },
      ball: {
        posx: this.ball.posx,
        posy: this.ball.posy,
      },
      countdown: this.countdown,
    };
  }
}
