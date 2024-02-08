<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import  ioClient  from 'socket.io-client';
  import axios  from "axios";
  import Game from "./Game.svelte";
  import type { GameState, Settings } from "./Class";
  import type { WsException } from "../../types";
  import { Status } from "../../types";
  import { socket as _socket } from "../../stores"
  import { toast } from '@zerodevx/svelte-toast/dist'
  import { querystring } from "svelte-spa-router";

  class Match {
    player1: string;
    player2: string;
  }

  let pause: boolean = false;

  let settings: Settings = { ballSize: 1, ballSpeed: 1, paddleSize: 1, paddleSpeed: 1 };

  let gameList: Match[] = [];

  let currentMatch: Match = { player1: '', player2: '' }

  let update_child: (state: GameState) => void;

  let unique = {} //used to restart Game component

  let friendly = false;
  let friendUsername = '';

  let awayPlayer: string = '';

  let inGame: boolean = false;
  let gameRequest: boolean = false;
  let watch = false;

  let socket = ioClient(axios.defaults.baseURL, {
    path: '/pong',
    withCredentials: true
  });


  setInterval(() => {
  const start = Date.now();

  socket.emit("ping", () => {
      const duration = Date.now() - start;
    });
  }, 1000);

  onMount(() => {

    const searchParams = new URLSearchParams($querystring)
    if (searchParams.has('player2') === true) {
      friendly = true
      friendUsername = searchParams.get('player2')
    }

    socket.on('gameStart', (match) => {
      currentMatch = match;
      toast.push('game is starting !');
      $_socket.emit('setOnlineStatus', Status.ingame)
    });

    socket.on('watchGame', (res) => {
      if (res.response === true) {
        currentMatch = res.players;
        settings = res.settings;
        watch = true;
      } else {
        alert('This match is no longer played, refresh the page');
      }
    });

    socket.on('unPause', (match) => {
      pause = false;
      currentMatch = match
      toast.push('Player reconnection: game resumes')
    });

    socket.on('pause', (username) => {
      pause = true;
      awayPlayer = username.username;
    });

    socket.on('bothLeft', () => {
      restart();
      toast.push('both players left the game');
      inGame = false;
    });

    socket.on('win', () => {
      restart();
      toast.push('you win!', { classes: ['success'] });
      inGame = false;
      $_socket.emit('setOnlineStatus', Status.online)
    });

    socket.on('lose', () => {
      restart();
      toast.push('you lose!', { classes: ['failure'] })
      inGame = false;
      $_socket.emit('setOnlineStatus', Status.online)
    });

    socket.on('endWatch', (player) => {
      if (watch) {
        restart();
        toast.push(player.username + ' has won the game');
        watch = false;
      }
    });

    socket.on('opponentLeft', (player) => {
      restart();
      if (watch && player.username)
        toast.push(player.username + ' has left the game');
      else if (player.username) {
        toast.push(player.username + ' has left the game, you win!');
        $_socket.emit('setOnlineStatus', Status.online)
      }
      inGame = false;
    });

    socket.on('gameState', (state) => {
      inGame = true;
      update(state);
      gameRequest = false;
      if (state.stop)
        inGame = false
    });

    socket.on('exception', (e: WsException) => {
      alert(e.message)
    });

    socket.on('alreadyRequested', () => {
      toast.push('Game already requested!');
      gameRequest = false;
    });

    socket.on('badSettings', () => {
      toast.push('Bad settings');
      gameRequest = false;
    });

    socket.on('disconnect', () => $_socket.emit('setOnlineStatus', Status.online))

    return ()=> {
      socket.close();
    };
  });

  function update(state: GameState) {
    update_child(state);
  }

  function restart() {
    unique = {};
    gameList = [];
    getGames();
  }

  getGames();

  async function getGames() {
    let games = (await axios.get('/pong')).data;
    for (const game of games) {
      gameList.push(game);
    }
    gameList = gameList;
  }

  function handleKeyup(e: KeyboardEvent) {
    if (inGame === false)
      return ;
    if (e.key === 'w' || e.key === 's'
      || e.key === 'ArrowUp' || e.key === 'ArrowDown')
      e.preventDefault()

    socket.emit('control', { press: false, key: e.key });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (inGame === false)
      return ;
    if (e.key === 'w' || e.key === 's'
      || e.key === 'ArrowUp' || e.key === 'ArrowDown')
      e.preventDefault()

    socket.emit('control', { press: true, key: e.key });
  }

  function requestGame() {
    if (friendly) {
      socket.emit('requestGame', { friend: friendUsername, settings: settings });
    } else {
      socket.emit('requestGame', { friend: undefined,  settings: settings });
    }

    gameRequest = true;
  }

  function cancelRequest() {
    socket.emit('cancelRequest', {});
    gameRequest = false;
  }

  function watchGame(game: string) {
    socket.emit('watchGame', {gameName: game});
  }

</script>

<svelte:body on:keydown={handleKeydown} on:keyup={handleKeyup} />

<div id="all">

{#if !inGame}

<h1 id="title"> Pong </h1>

<div id="body">


  {#if !gameRequest}
  <div class="panel">
    <h2>Play game</h2>

    {#if friendly}
    <h3>Opponent</h3>
    <input bind:value={friendUsername} type="text" placeholder="your friend username" class="input">
    {/if}

    <h3>Game type</h3>

    <select class="select select-bordered" bind:value={friendly}>
      <option value={true} selected>Friendly</option>
      <option value={false}>Ranked</option>
    </select>

    <br>

    {#if friendly}

    <h3>Settings</h3>
    <table id="settingsTable">

    <tr>
    <td align="left"><label for="ballSpeed">ball speed</label></td>
    <td align="right"><input class="input" bind:value={settings.ballSpeed} type="number" min="0.5" max="3" step="0.1"></td>
    </tr>

    <tr>
    <td align="left"><label for="ballSize">ball size</label></td>
    <td align="right"><input class="input" bind:value={settings.ballSize} type="number" min="0.5" max="2" step="0.1"></td>
    </tr>

    <tr>
    <td align="left"><label for="paddleSpeed">paddle speed</label></td>
    <td align="right"><input class="input" bind:value={settings.paddleSpeed} type="number" min="0.5" max="2" step="0.1"></td>
    </tr>

    <tr>
    <td align="left"><label for="paddleSize">paddle size</label></td>
    <td align="right"><input class="input" bind:value={settings.paddleSize} type="number" min="0.5" max="2" step="0.1"></td>
    </tr>
    </table>
    {/if}
  <br>
  {#if friendly}
  <button class="btn" on:click={requestGame}>request friendly game</button>
  {:else}
  <button class="btn" on:click={requestGame}>request random game</button>
  {/if}


  </div>

 <div class="panel">
 <h2>Watch Game</h2>
 {#if gameList.length}
  <ul id="gameList">
    {#each gameList as game}
      <li>{game.player1 + ' vs ' + game.player2} <button id="watchButton" on:click={() => watchGame(game.player1)}>watch</button></li>
    {/each}
  </ul>
{:else}
  <p>No games to watch at the moment !</p>
{/if}
</div>

 {/if}

</div>
{/if}

{#if inGame}
{#key unique}
<Game bind:socketInGame={socket} bind:gameSettings={settings} bind:players={currentMatch} bind:gamePause={pause} bind:away={awayPlayer} bind:update_state={update_child}></Game>
{/key}
{/if}

{#if gameRequest}
<h3>Game requested ! Waiting for your opponent ...</h3>
<br>
<br>
<button class="btn" on:click={cancelRequest}>Cancel</button>
{/if}

</div>


<style>

#all {
  color: var(--white);
  background-color: none;
  padding-bottom: 2em;
  text-align: center;
  height: 100%;
  overflow-y: scroll;
}

#body {
  display:flex;
  flex-direction: row;
  align-content: center;
  margin-right: 5em;
  margin-left: 5em;
  gap: 50px;

}

#title {
  margin-top:1em;
  text-shadow:  0 0 10px ;
  color: var(--pink);
  font-size: 2em;
  font-weight: bold;
  margin-bottom:2em;
}

.panel {
  background-color: var(--lite-grey);
  border-radius: var(--panel-radius);
  flex-grow:1;
  padding-bottom:1em;
}

#settingsTable {
  margin-top:1em;
  margin-left:auto;
  margin-right:auto;
}

h2 {
  font-family: Courier, monospace;
  border-top-right-radius:10px;
  border-top-left-radius:10px;
  background-color:var(--grey);
  font-size:1.3em;
  color:var(--orange);
  font-weight:bold;
  margin-bottom:1em;
}

h3 {
  font-size:1.1em;
  font-family: Courier, monospace;
  color:var(--orange);
  font-weight:bold;
  margin-top:1.2em;
}

input {
  color: black;
}

select {
  color: black;
}

button:hover {
  background-color:#2d333c
}

@media only screen and (max-width: 800px) {
  #body {
    flex-direction: column;
  }
}

</style>
