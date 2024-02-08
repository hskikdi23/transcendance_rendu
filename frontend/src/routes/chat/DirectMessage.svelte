<script lang="ts">

  import axios from "../../axios.config";
  import { user } from "../../stores";
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import ioClient from 'socket.io-client';
  import type { Socket } from "socket.io-client";
  import type { DirectMessage, WsException } from "../../types";
  import { push } from "svelte-spa-router";
  import { toast } from '@zerodevx/svelte-toast/dist'

  let socket: Socket = null
  let message: string = null
  let messages: DirectMessage[] = []
  let chatbox: any
  let penpals: string[] = []
  let chatUser: string = null

  const enum Tab {
    Friends,
    DM
  }

  let tab: Tab = Tab.Friends

  const delay = ms => new Promise(res => setTimeout(res, ms));

  onMount(async () => {

    try {
      const response = await axios.get('/posts/penpals/foo')
      penpals = response.data
    } catch(e) {
        toast.push(e.response.data.message, {classes: ['failure']})
    }

    socket = ioClient(axios.defaults.baseURL, {
      path: '/chat',
      withCredentials: true,
      query: { dm: 'true', username: $user.username }
    })

    socket.on('connect', () => {
    })

    socket.on('exception', (e: WsException) => {
      toast.push(e.message, {classes: ['failure']})
    })

    socket.on('changeName', () => {
      toast.push('This user changed his name. You might want to reload the page before sending dm');
    });

    socket.on('dm', async (_message: string, sender: string, date: Date) => {
      const dm: DirectMessage = {
        content: _message,
        sender: sender,
        recipient: $user.username,
        date: date
      }
      if ($user.blocked.some(user => user.username === dm.sender) === true)
        dm.content = '*blocked content*'
      messages.push(dm)
      messages = messages
      await delay(100);
      chatbox.scroll({ top: chatbox.scrollHeight + 10000, behavior: 'smooth'})
    })

    socket.on('blocked', () => {
      toast.push('This user blocked you');
    });

  })

  onDestroy(() =>  {
    closeSocket()
    messages.splice(0, messages.length)
    penpals.splice(0, penpals.length)
    chatUser = null
    message = null
  })

  async function sendDM() {
    if (!message)
      return;
    socket.emit('sendDirectMessage', {
      content: message,
      recipient: chatUser
    } as DirectMessage, (response: string) => {
      message = ''
      messages = messages
    })
    await delay(100);
    chatbox.scroll({ top: chatbox.scrollHeight + 100 , behavior: 'smooth'})
  }

  async function getDMsByUsername(username: string) {
    try {
      const response = await axios.get(`/posts/dm/${username}`)
      messages = response.data
      await delay(100);
      chatbox.scroll({ top: chatbox.scrollHeight + 100 , behavior: 'smooth'})
    } catch (e) {
        toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function pushToDmTab(username: string) {
    tab = Tab.DM;
    chatUser = username;
    await getDMsByUsername(chatUser)
  }

  function closeSocket() {
    if (socket !== null)
      socket.disconnect()
  }

  function switchTab(target: Tab) {
    tab = target
    if (target === Tab.Friends) {
      chatUser = null
      messages.splice(0, messages.length)
    }
  }

  // afterUpdate(() => {
  //   chatbox.scroll({ top: chatbox.scrollHeight, behavior: 'smooth'})
  // })

</script>

<div class="chat-dm">

  <div class="nav">
    <button on:click={() => switchTab(Tab.Friends)} class={tab === Tab.Friends ? 'activeButton left': 'left'}>Your friends</button>
    <button on:click={() => switchTab(Tab.DM)} class={tab === Tab.DM ? 'activeButton right': 'right'}>DM</button>
  </div>

  {#if tab === Tab.Friends}
  <div class="find">
      <div class="title">
        <h2>All your friends</h2>
      </div>
      <div class="title">
        <h2>Recent dm</h2>
      </div>
      <div class="list " id="leftList">
        <ul class="friends-list">
          {#if $user !== undefined}
            {#each $user.friends as friend}
              <li class="friend"> <button on:click={() => pushToDmTab(friend.username)}> {friend.username}</button> </li>
            {/each}
          {/if}
        </ul>
      </div>
      <div class="list">
        <ul class="friends-list">
          {#each penpals as penpal}
            <li class="friend"><button on:click={() => pushToDmTab(penpal)}> {penpal}</button></li>
          {/each}
        </ul>
      </div>
    </div>
  {:else}
  <div class="disccus">
    {#if chatUser == null}
    <div class="void">
      <h1>You are not conected with a user</h1>
    </div>
    {:else}
      <div class="chatHeader">
      <h1 class="friendName">{chatUser}</h1>
      <button class="btn btn-sm invite-button" on:click={() => push(`/Pong?player2=${chatUser}`)}>invite to play</button>
      </div>
      <div class="chatbox" bind:this={chatbox}>
        <ul class="message-list">
          {#each messages as _message}
            {#if _message.sender === $user.username}
            <li class="msg sender">
            <span class="date">{_message.date}</span><br>
            <span class="content">{_message.content}</span></li>
            {:else}
            <li class="msg receiver">
            <span class="date">{_message.date}</span><br>
            <span class="content">{_message.content}</span></li>
            {/if}
            {/each}
          </ul>
      </div>
      <form on:submit|preventDefault={sendDM}>
        <input type="text"  class="input input-sm inpput-bordered" placeholder="message" bind:value={message}>
        <button type="submit" class="btn btn-sm send">send</button>
      </form>
    {/if}
  </div>
  {/if}

</div>

<style>

  .chat-dm {
    display: flex;
    flex-direction: column;
    box-sizing: content-box;
    height: var(--panel-height);
    width: var(--panel-width);
  }

  .nav {
    height: var(--nav-height);
    display: flex;
    justify-content: space-around;
  }

  .nav button {
    flex: auto;
    font-family: Courier, monospace;
    color: var(--orange);
    background-color: var(--grey);
    font-size:1.2em;
  }

  .nav button:hover {
    text-decoration: underline;
  }

  .nav .activeButton {
    background-color: none;
    font-weight: bold;
  }

  .nav button:not(:last-child) {
    border-right: solid 1px var(--black);
  }

  .find {
    height: 360px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    background-color: var(--lite-grey);
    border-radius: 0 0 var(--panel-radius) var(--panel-radius);
  }

  .title {
    height: 40px;
    background-color: var(--lite-grey);
    font-weight:bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .list {
    flex: 1;
    overflow: auto;
  }

  #leftList {
    border-right:1px solid;
  }

  *::-webkit-scrollbar {
    display: none;
  }


  .friend {
    color:white;
    display: grid;
    grid-template-columns: 4fr 1fr 1fr 1fr;
    background-color: var(--li-one);
    height:40px;
  }
  .friend:nth-child(2n + 1){
   background-color: var(--li-two);
  }


  .friend:hover {
    text-decoration:underline;
  }

  .disccus {
    height: 360px;
    background-color: var(--lite-grey);
    border-bottom-left-radius: var(--panel-radius);
    border-bottom-right-radius: var(--panel-radius);
  }

  .disccus .void {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

.chatbox {
  height: 75%;
  width: 80%;
  overflow-y: scroll;
  background-color: var(--grey);
  color: #fff;
  border: 2px solid var(--pink);
  border-radius:10px;
  margin-left:10%;
}

.chatHeader {
  margin-bottom:1.5%;
  margin-top:0.5%;
  margin-right:10%;
  margin-left: 10%;
}

.invite-button {
  float:left;
}

.chatHeader h1 {
  float: right;
}

.friendName {
  font-size:1.2em;
  font-weight:bold;
  color:white;
}

form {
  margin-left: 20%;
  margin-right: 20%;
  margin-bottom:2%;
  margin-top:2%;
}

input {
  float:left;
}
.send {
  float:right;
}


.message-list {
  list-style: none;
  margin: 1rem auto;
  padding: 0;
  max-width: 400px;
  display: flex;
  flex-direction: column;

  --radius-big: 20px;
  --radius-small: 6px;

}

.msg {
  overflow-wrap: break-word;
  margin-bottom:1em;
}

.msg.sender {
  text-align: right;
}

.msg.receiver {
  text-align:left;
}

.date {
  font-size:0.8em;
}

.content {
  border-radius:var(--radius-big);
  box-decoration-break: clone;
  padding:3%;
  line-height:2.5em;
}

.msg.sender .content {
  background-color: var(--pink);
  border-bottom-right-radius:var(--radius-small);
}

.msg.receiver .content {
  background-color: var(--lite-grey);
  border-bottom-left-radius:var(--radius-small);
}



</style>
