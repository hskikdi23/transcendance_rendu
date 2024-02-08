<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameState, Settings } from './Class';
  import { Ball, Frame, Paddle } from './Objects'
  import { fade } from 'svelte/transition';
  import { push } from 'svelte-spa-router';

  export function update_state(state: GameState) {
    leftScore = state.score.leftScore;
    rightScore = state.score.rightScore;

    leftPaddle.posx = state.leftPaddle.posx * frameWidth / 600;
    leftPaddle.posy = state.leftPaddle.posy * frameHeight / 400;

    rightPaddle.posx = state.rightPaddle.posx * frameWidth / 600;
    rightPaddle.posy = state.rightPaddle.posy * frameHeight / 400;

    ball.posx = state.ball.posx * frameWidth / 600;
    ball.posy = state.ball.posy * frameHeight / 400;
    
    if (state.countdown === 0)
      countdown = 0;
    else
      countdown = Math.trunc(state.countdown / 100);
  };

  export let players = {player1: '', player2: ''};
  export let gameSettings: Settings = { ballSize: 1, ballSpeed: 1, paddleSize: 1, paddleSpeed: 1 };
  export let gamePause: boolean = false;
  export let away: string = '';
  export let socketInGame: any;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;

  let countdown: number = 3;

  let winHeight: number = window.innerHeight;
  let winWidth: number = window.innerWidth - Math.round(0.25 * window.innerWidth);

  let frameHeight: number;
  let frameWidth: number;


  if (winWidth / winHeight < 1.5) {
    frameWidth = winWidth;
    frameHeight = Math.round(winWidth / 1.5);
  } else {
    frameHeight = winHeight;
    frameWidth = Math.round(winHeight * 1.5);
  }

  let size = frameWidth / 30;

  const frame: Frame =  new Frame(frameWidth, frameHeight);
  const ball: Ball =  new Ball(frame, gameSettings); 
  const leftPaddle: Paddle = new Paddle(true, frame, gameSettings); 
  const rightPaddle: Paddle = new Paddle(false, frame, gameSettings); 

  let leftScore: number = 0;
  let rightScore: number = 0;

  window.onbeforeunload = function(event) {
      console.log('test');
      window.confirm("leave the game ? You will lose");
      socketInGame.emit('leave');
      socketInGame.close();
      cancelAnimationFrame(animationId);
    };


  onMount(() => {
    ctx = canvas.getContext("2d");

    let urls = Array.from(document.getElementsByTagName('a'));
    const oldurls = new Map();
    urls.forEach(url => {
      console.log(url.attributes.href.value);
      oldurls[url.attributes.href.value] = url.onclick;
      if (url.attributes.href.value !== '#/Pong')
      url.onclick = function(){
      if (window.confirm("leave the game ?"))
        socketInGame.close();
        push('/' + url.attributes.href.value);
      };
  });

        
    game_loop();
    return () => {
      cancelAnimationFrame(animationId);
      urls.forEach(url => {
        url.onclick = oldurls[url.attributes.href.value];
      });
    };
  });

  function game_loop() {
    draw();
    requestAnimationFrame(game_loop);
  }

  function drawPaddles() {
    ctx.fillStyle = 'rgb(249, 109, 0)';
    ctx.fillRect(leftPaddle.posx, leftPaddle.posy,
      leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.posx, rightPaddle.posy,
      rightPaddle.width, rightPaddle.height);
  }
  
  function drawBall() {
    ctx.fillStyle = 'rgb(255, 88, 171)';
    ctx.beginPath();
    ctx.arc(ball.posx, ball.posy, ball.radius, 0, Math.PI * 2, false);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, frame.width, frame.height);
    drawPaddles();
    drawBall();
    
  };
</script>

<div id="all" style="font-size: {size + 'px'}">
<p id="score">{leftScore}  -  {rightScore}</p>
<div id="game">
  <canvas id="canvas" bind:this={canvas} width={frame.width} height={frame.height}></canvas><br>
  {#if countdown != 0 && !gamePause}
  <p transition:fade id="countdown">{countdown}</p>
  {/if}
  {#if gamePause}
  <p id="pause">
    Waiting for {away} ... end of match in <span transition:fade > {countdown} </span>
  </p>
 {/if}
</div>
<p id="players">{players.player1}  VS  {players.player2}</p>
<div id="instructions">
  Use 🡑 and 🡓 or 'w' and 's' to move the paddles
</div>
</div>

<style>

#all {
  background-color: var(--grey);
  padding: 1em;
}

#score {
  text-align: center;
  font-weight: bold;
  color:var(--pink);
  margin-bottom: 1em;
}

#players {
  text-align: center;
  font-weight: bold;
  color:var(--lite-lite-grey);
  margin-bottom: 1em;
}

#game {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: auto;
  margin-top: auto;
}

#canvas {
  margin-left: auto;
  margin-right: auto;
  border: 1px solid grey;
}

#countdown {
  position: absolute;
  top: 60%;
  left: 47%;
  font-size: 3.5em;
  font-weight: bold;
  color: var(--lite-lite-lite-grey);
}

#instructions {
  font-family:'Courier New', Courier, monospace;
  font-size: 0.5em;
  color:var(--orange);
}


#instructions {
  font-family:'Courier New', Courier, monospace;
  font-size: 0.5em;
  color:var(--orange);
}

#pause {
  position: absolute;
  top: 60%;
  left: 25%;
  font-weight: bold;
  color:var(--lite-lite-grey);
}

</style>


