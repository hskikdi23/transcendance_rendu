<script lang="ts">
    import axios from './axios.config'
    import chatIcon  from './assets/chat.svg'
    import gameIcon     from './assets/joystick.svg'
    import leaderboardIcon     from './assets/leaderboard.svg'
    import { id, logged, user, reloadImage} from "./stores";
    import routes from "./routes";
    import Router, { link } from "svelte-spa-router";
    import Connection from './routes/Connection.svelte';
    import { SvelteToast } from '@zerodevx/svelte-toast/dist';
    import { handleImageError } from './utils'
    import ioClient from 'socket.io-client';

    let twoFAValue;
    const toastApp = new SvelteToast({
      target: document.body,
    })

    const menuItems = [
      { label: 'Messages', icon: chatIcon, link: '#/chat' },
      { label: 'Game', icon: gameIcon, link: '#/Pong'},
      { label: 'LeaderBoard', icon: leaderboardIcon, link: '#/leaderboard'}
    ];

    logged.set('false');

    $: {
      const params = new URLSearchParams(window.location.search);
      twoFAValue = params.get('twoFA');
      params.delete("twoFA")
      getProfile()
    }

    async function getProfile() {
      try {
        const response = await axios.get('/auth/whoami');
        user.set(response.data)
        id.set(response.data.id.toString())
        logged.set('true')
      } catch (e) {
      }
    }

</script>

{#if $logged === 'true'}
<div class="screen">
      <div class="profileLink">
        {#if $user}
          <a use:link href="/users/{$user.username}">
            <img class="profilePicture" src='{COMMON_BASE_URL}:3000/images/actual/{$user.id}/?$reload=${$reloadImage}' on:error={handleImageError} alt="profile">
          </a>
        {/if}
      </div>
      <div class="nav">
        {#each menuItems as item}
          <a href={item.link}>
          <img  class="linkButton" src={item.icon} alt={item.label} />
          </a>
        {/each}
      </div>
      <div class="fillSpace">
      </div>

      <div class="routes">
        {#await getProfile() then _}
          {#if $user}
            <Router {routes}/>
          {/if}
        {/await}
      </div>
    </div>

    {:else}
      {#await getProfile() then _}
        <Connection bind:twoFAValue/>
      {/await}
    {/if}

  <style>

  :global(.success) {
    --toastBackground: green;
  }

  :global(.failure) {
    --toastBackground: red;
  }

  :root {
    --li-one: #393939;
    --li-two: #505050;
    --lite-lite-lite-grey: #acacac;
    --lite-lite-grey: #888888;
    --lite-grey: #707070;
    --grey: #222222;
    --black: black;
    --white: white;
    --orange: #f96d00;
    --pink: rgb(255, 88, 171);
    --imageRadius: 50%;
    --panel-height: 400px;
    --panel-width: 550px;
    --panel-radius: 15px;
    --nav-height: 40px;
  }

  .screen {
    display: grid;
    height: 100vh;
    grid-template-columns: 90px 1fr;
    grid-template-rows: 90px 1fr 90px;
  }

  .profileLink {
    grid-column: 1/2;
    grid-row: 1/2;
    background-color: var(--grey);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .profileLink .profilePicture {
    height: 50px;
    width: 50px;
    border-radius: var(--imageRadius);
  }

  .profileLink .profilePicture:hover {
    transform: scale(1.10);
    overflow: hidden;
  }

  .nav {
    grid-column: 1/2;
    grid-row: 2/3;
    background-color: var(--grey);
    display: flex;
    row-gap: 35px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .nav .linkButton {
    height: 50px;
    width: 50px;
  }

  .nav .linkButton:hover {
    transform: scale(1.10);
    overflow: hidden;
  }

  .fillSpace {
    grid-column: 1/2;
    grid-row: 3/4;
    background-color: var(--grey);
  }

  .routes {
    grid-column: 2 / 3;
    grid-row: 1 / 4;
    background-color: #303030;
  }

</style>
