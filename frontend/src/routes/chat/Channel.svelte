<script lang="ts">

  import axios from "../../axios.config";
  import { onDestroy, onMount } from "svelte";
  import { user } from "../../stores";
  import ioClient from 'socket.io-client';
  import type { Socket } from "socket.io-client";
  import { type Channel, type PostEmitDto, type WsException, ChannelStatus } from "../../types";
  import lockedIcon from '../../assets/lock.svg'
  import publicIcon from '../../assets/public.svg'
  import privateIcon from '../../assets/private.svg'
  import { toast } from '@zerodevx/svelte-toast/dist'

  let socket: Socket = null
  let message: string = ''
  let channel: Channel = null
  let posts: PostEmitDto[] = []
  let channelName: string = null;
  let listChannel: any[] = [];
  let chatbox: any

  const enum Tab {
    AllChannels,
    OneChannel
  }

  const delay = ms => new Promise(res => setTimeout(res, ms));

  let tab: Tab = Tab.AllChannels

  export let channels: any[]
  export let reloadChannels = async () => {}
  export let joinChan: string = '';
  export let count: number = 0;

  export function joinWSRoom(channelName: string) {
    console.log("test join from Channel.svelte");
    console.log(channelName);
  };


  $: listChannel = channels.filter(channel => channel.users.some(_user => _user.username == $user.username))

  onMount(() => {

    socket = ioClient(axios.defaults.baseURL, {
      path: '/chat',
      withCredentials: true,
      query: { dm: 'false', username: $user.username }
    })

    socket.on('connect', () => {
    })

    socket.on('disconnect', (cause) => {
    })

    socket.on('post', async (post: PostEmitDto) => {
      if (!($user.blocked.some(user => user.username === post.author) === true))
      {
          if (post.channelName == channelName) {
          posts.push(post)
          posts = posts
          await delay(100);
          chatbox.scroll({ top: chatbox.scrollHeight + 10000, behavior: 'smooth'})
        }
      }
    })

    socket.on('exception', (e: WsException) => {
      toast.push(e.message, { classes: ['failure'] })
    })

    socket.on('userleave', async(msg) => {
      if ($user.username !== msg.username)
        toast.push(msg.username + " has left " +  msg.channelName);
      await reloadChannels();
      if (channelName)
        await getChannel();
    });

    socket.on('userjoin', async(msg) => {
      if ($user.username !== msg.username)
        toast.push(msg.username + " has joined " +  msg.channelName);
      await reloadChannels();
      if (channelName)
        await getChannel();
    });

    socket.on('userban', async (msg) => {
      console.log('userban');
      if ($user.username === msg.username) {
        toast.push("you have been banned from " +  msg.channelName);
        await reloadChannels()
        console.log(channel);
        switchTab(Tab.AllChannels);
      }
      else {
        toast.push(msg.username + " has been banned from " +  msg.channelName);
        await reloadChannels()
        if (channelName)
          getChannel();
      }
    });

    socket.on('userkick', async (msg) => {
      if ($user.username === msg.username) {
        toast.push("you have been kicked from " +  msg.channelName);
        await reloadChannels()
        switchTab(Tab.AllChannels);
      }
      else {
        toast.push(msg.username + " has been kicked from " +  msg.channelName);
        await reloadChannels()
        if (channelName)
          getChannel();
      }
    });


  })

  $: count && socket && joinChannel(joinChan);

  onDestroy(() => closeSocket())

  async function joinChannel(_channelName: string) {
    if (_channelName) {
      socket.emit('joinRoom', _channelName);
      channelName = _channelName;
      await getChannel()
      tab = Tab.OneChannel
    }
  }

  async function leaveChannel(name: string) {
    try {
      await axios.patch(`/channel/leave/${name}`)
      socket.emit('leaveRoom', name);
      await reloadChannels()
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  function closeSocket() {
    if (socket !== null) {
      socket.disconnect()
      channelName = null
      posts.splice(0, posts.length)
    }
  }

  async function post() {
    if (message === null || message === '')
      return;
    socket.emit('sendPost', {
      content: message,
      channelName: channelName,
    }, (response: string) => {
      message = ''
    })
    await delay(100);
    chatbox.scroll({ top: chatbox.scrollHeight + 10000, behavior: 'smooth'})
  }

  async function getChannel() {
    try {
      const response = await axios.get(`/channel/${channelName}`)
      channel = response.data
    } catch (e) {
      channel = null
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function revokeAdmin(id: number) {
    try {
      await axios.patch(`/channel/revoke/${channel.name}/${id}`, null)
      if (channelName)
       await getChannel()
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function promoteAdmin(id: number) {
    try {
      await axios.patch(`/channel/promote/${channel.name}/${id}`, null)
      await getChannel()
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function ban(username: string, userId: number, channelName: string) {
    try {
      await axios.delete(`/channel/ban/${channel.name}/${userId}`)
      socket.emit('ban', { username: username, channelName: channelName });
      if (channelName)
       await getChannel()
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function kick(username: string, userId: number, channelName: string) {
    try {
      await axios.delete(`/channel/kick/${channel.name}/${userId}`)
      socket.emit('kick', { username: username, channelName: channelName });
      if (channelName)
        await getChannel()
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function mute(userId: number) {
    socket.emit('mute', {
      channelName: channel.name,
      userId: userId,
      seconds: 30
    }, (response: string) => {
      toast.push(response, { classes: ['success'] })
    })
  }

  async function connectChannel(_channel: string) {
    channelName = _channel
    socket.emit('getChanPosts', _channel);
    await getChannel()
    tab = Tab.OneChannel
  }

  function switchTab(target: Tab) {
    tab = target
    if (target === Tab.AllChannels) {
      channelName = null;
      posts.splice(0, posts.length)
    }
  }

  async function updateChannelPassword(name: string) {

    const password: string = prompt('new password')

    if (password === null)
      return

    if (password === '')
      return toast.push('empty password', { classes: ['failure'] })

    const body = { channelName: name, password: password }

    try {
      await axios.patch('/channel/password', body)
      toast.push('password updated!', { classes: ['success'] })
    } catch(e) {
      toast.push(e.response.data.message, { classes: ['failure'] })
    }
  }

  async function updateChannelStatus(name: string, status: ChannelStatus) {

    let password: string = ''

    if (status === ChannelStatus.Protected) {
      password = prompt('channel password')
      if (password === null)
        return
      if (password === '')
        return toast.push('empty password', { classes: ['failure'] })
    }

    const body = {
      channelName: name,
      status: status,
      password: password
    }

    try {
      await axios.patch('/channel/status', body)
      toast.push('status updated!', { classes: ['success'] })
      await reloadChannels()
    } catch(e) {
      toast.push(e.response.data.message, { classes: ['failure'] })
    }
  }

  async function inviteUserToChannel(name: string, userId: number) {

    const body = {
      channelName: name,
      userId: userId
    }

    try {
      await axios.patch('/channel/invite', body)
      toast.push('invitation send!', { classes: ['success'] })
    } catch(e) {
      toast.push(e.response.data.message, { classes: ['failure'] })
    }
  }

</script>

<div class="chat-channel">

  <div class="nav">
    <button on:click={() => switchTab(Tab.AllChannels)} class={tab === Tab.AllChannels ? 'activeButton left' : 'left'}>Your channels</button>
    <button on:click={() => switchTab(Tab.OneChannel)} class={tab === Tab.OneChannel ? 'activeButton right' : 'right'}>
      {#if channelName !== null}
        {channelName}
      {:else}
        Channel
      {/if}
    </button>
  </div>

  {#if tab === Tab.AllChannels}
    <div class="find">
      <div class="list">
        <ul>
          {#each listChannel as channel}
          <li class="lineFriends">
            <button class="chanName" on:click={() => connectChannel(channel.name)}>{channel.name}</button>
            {#if channel}
            <span>
              {#if channel.status === ChannelStatus.Protected}
                <img src={lockedIcon} alt='protected' width="30" height="30"/>
              {:else if channel.status === ChannelStatus.Public}
                <img src={publicIcon} alt='public' width="30" height="30"/>
              {:else if channel.status === ChannelStatus.Private}
                <img src={privateIcon} alt='private' width="30" height="30"/>
              {/if}
            </span>
            <span>
              <div class="badge badgs-xs badge-ghost">
              {#if channel.owner.id === $user.id}
                owner
              {:else if channel.admins.some(admin => admin.username === $user.username)}
                admin
              {:else}
                member
              {/if}
              </div>
            </span>
            <span>
              <button class="btn btn-xs" on:click={() => leaveChannel(channel.name)}>
                leave
              </button>
            </span>
            {/if}
          </li>
        {/each}
        </ul>
      </div>
    </div>
  {:else if channelName === null}
    <div class="void">
      <h1>Please select a channel</h1>
    </div>
  {:else}
    <div class="ctn-chan">

      <div class="chan-list">
        {#if channel?.owner?.id === $user.id}
        <!-- channel visibility -->
        <details class="dropdown">
          <summary class="m-1 btn btn-xs">Change visibility</summary>
          <ul class="menu dropdown-content bg-base-100 rounded-box w-30">
          {#if channel.status === ChannelStatus.Public}
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Private)}>private</button></li>
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Protected)}>protected</button></li>
          {:else if channel.status === ChannelStatus.Protected}
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Public)}>public</button></li>
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Private)}>private</button></li>
          {:else}
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Public)}>public</button></li>
            <li><button on:click={() => updateChannelStatus(channel.name, ChannelStatus.Protected)}>protected</button></li>
          {/if}
          </ul>
        </details>
        <!-- channel password -->
          {#if channel?.status === ChannelStatus.Protected}
            <button class="btn btn-xs" on:click={() => updateChannelPassword(channel.name)}>Change password</button>
          {/if}
        <!-- channel invitation -->
          {#if channel?.status === ChannelStatus.Private}
            <details class="dropdown">
              <summary class="m-1 btn btn-xs">Invite friend</summary>
              <ul class="menu dropdown-content bg-base-100 rounded-box w-30">
                {#each $user.friends as friend}
                  <li><button class="btn btn-xs" on:click={() => inviteUserToChannel(channel.name, friend.id)}>{friend.username}</button></li>
                {/each}
              </ul>
            </details>
          {/if}
        {/if}
        <ul>
        {#if channel}
          <li><h1>--owner--</h1></li>
          <li>
            <a contenteditable="false" bind:innerHTML={channel.owner.username} href="#/users/{channel.owner.username}"/>
            <details class="dropdown">
              <summary class="m-1 btn btn-xs">settings</summary>
              <ul class="menu dropdown-content bg-base-100 rounded-box w-30">
                <li><a contenteditable="false" href="#/users/{channel.owner.username}">profile</a></li>
              </ul>
            </details>
          </li>
          <li><h1>--admins--</h1></li>
          {#each channel.admins.filter(admin => admin.id !== channel.ownerId) as admin}
            <li>
              <a contenteditable="false" bind:innerHTML={admin.username} href="#/users/{admin.username}"/>
              {#if channel.admins.some(_admin => _admin.username === $user.username && admin.username !== $user.username)}
                <details class="dropdown">
                  <summary class="m-1 btn btn-xs">settings</summary>
                  <ul class="menu dropdown-content bg-base-100 rounded-box w-30">
                    <li><button on:click={() => kick(admin.username, admin.id, channel.name)}>kick</button></li>
                    <li><button on:click={() => ban(admin.username, admin.id, channel.name)}>ban</button></li>
                    <li><button on:click={() => revokeAdmin(admin.id)}>down</button></li>
                  </ul>
                </details>
              {/if}
            </li>
          {/each}
          <li><h1>--users--</h1></li>
          {#each channel.users.filter(_user => !channel.admins.some(admin => admin.id === _user.id)) as _user}
            <li>
              <a contenteditable="false" bind:innerHTML={_user.username} href="#/users/{_user.username}"/>
              <details class="dropdown">
                <summary class="m-1 btn btn-xs">settings</summary>
                <ul class="menu dropdown-content bg-base-100 rounded-box w-30">
                  <li><a contenteditable="false" href="#/users/{_user.username}">profile</a></li>
                  {#if channel.admins.some(admin => admin.username === $user.username)}
                    <li><button on:click={() => ban(_user.username, _user.id, channel.name)}>ban</button></li>
                    <li><button on:click={() => kick(_user.username, _user.id,  channel.name)}>kick</button></li>
                    <li><button on:click={() => mute(_user.id)}>mute(30s)</button></li>
                    <li><button on:click={() => promoteAdmin(_user.id)}>up</button></li>
                  {/if}
                </ul>
              </details>
            </li>
          {/each}
        {/if}
        </ul>
      </div>

            <div class="chat2">

              <div class="chatbox" bind:this={chatbox}>
                <ul class="message-list">
                  {#each posts as post}
                  {#if post.author != $user.username}
                    <li class="msg receiver">
                    <span class="author">*{post.author}:</span><br>
                    <span class="content">{post.content}</span></li>
                  {:else}
                    <li class="msg sender"><span class="content">{post.content}</span></li>
                  {/if}
                  {/each}
                </ul>
              </div>
              <form class="chat-form" on:submit|preventDefault={post}>
                <input type="text" placeholder="message" bind:value={message}>
              </form>

            </div>
           </div>

  {/if}

  </div>

<style>

.chat-channel{
  background-color: var(--lite-grey);
  border-radius: var(--panel-radius);
  display: grid;
  grid-template-rows: auto 1fr;
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
  font-size:1.2em;
  background-color: var(--grey);
}

.nav .activeButton {
  background-color: none;
  font-weight: bold;
}

.nav button:hover {
  text-decoration: underline;
}

.nav button:not(:last-child) {
  border-right: solid 1px var(--black);
}

.find {
  height: 360px;
  background-color: var(--lite-grey);
  border-radius: 0 0 15px 15px;
}

.list {
  flex: 1;
  overflow: auto;
}

.lineFriends {
  color:white;
  display: grid;
  grid-template-columns: 4fr 1fr 1fr 1fr;
  background-color: var(--li-one);
  height:40px;
}

.chan-list {
  overflow: auto;
}

.lineFriends:nth-child(2n + 1) {
  background-color: var(--li-two);
}

.chanName:hover {
  text-decoration:underline;
}

li h1 {
  color: #fff;
}

.lineFriends span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctn-chan {
  display: grid;
  grid-template-columns: 1fr 2fr;
  max-height: 331px;
}

.void {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chatbox {
  width: 100%;
  height: 336px;
  overflow-y: scroll;
  background-color: var(--grey);
  color: #fff;
  border: 2px solid var(--pink);
}

.chat-form {
  display: flex;
}

.chat-form input {
  width: 100%;
  border-radius: 0 0 var(--panel-radius) 0;
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

.content {
  border-radius:var(--radius-big);
  box-decoration-break: clone;
  padding:3%;
  line-height:2.5em;
}

.author {
  margin-left:1%;
  font-size:0.8em;
}

.msg.sender .content {
  border-bottom-right-radius:var(--radius-small);
  background-color: var(--pink);
}

.msg.receiver .content {
  border-bottom-left-radius:var(--radius-small);
  background-color: var(--lite-grey);

}


*::-webkit-scrollbar {
  display: none;
}

@keyframes marquee {
  0% {
    left: 100%;
  }
  100% {
    left: -100%
  }
}

</style>
