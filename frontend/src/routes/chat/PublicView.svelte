<script lang="ts">
  import axios from "../../axios.config";
  import { user } from "../../stores";
  import { ChannelStatus, type ChannelDto } from "../../types";
  import { toast } from '@zerodevx/svelte-toast/dist'
  import lockedIcon from '../../assets/lock.svg'
  import publicIcon from '../../assets/public.svg'
  import privateIcon from '../../assets/private.svg'

  export let channels: any[]
  export let reloadChannels = async () => {}

  let password: string = ''

  export let join: (channelName: string) => void;

  async function joinChannel(channel: any) {

    if (channel.status === ChannelStatus.Protected) {
      password = prompt('Enter password')
      if (password === null) {
        password = ''
        return
      }
      else if (password === '')
        return toast.push('empty password', { classes: ['failure'] })
    }

    try {
      await axios.patch(`http://localhost:3000/channel/join`, {
        channelName: channel.name,
        password: password,
        status: channel.status
      } as ChannelDto)
      await reloadChannels()
      join(channel.name);
      toast.push(`Successfully joined ${channel.name}`, { classes: ['success'] })
      password = ''
    } catch(e) {
      toast.push(e.response.data.message, { classes: ['failure'] })
      password = ''
    }
  }

</script>

<div class="create-pannel">

  <div class="title">
    <h1>All channels</h1>
  </div>

  <div class="list">
    <ul>
    {#each channels as channel}
      {#if (channel.status !== ChannelStatus.Private && channel.users.some(_user => _user.username === $user.username) === false)
        || channel.status === ChannelStatus.Private && channel.invited.some(_user => _user.username === $user.username) === true}
      <li class="lineFriends">
        <span>{channel.name}</span>
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
          <button class="btn btn-xs" on:click={() => joinChannel(channel)}>join</button>
        </span>
      </li>
      {/if}
    {/each}
    </ul>
  </div>

</div>

<style>

.create-pannel {
  background-color: var(--lite-grey);
  border-radius: var(--panel-radius);
  display: grid;
  grid-template-rows: auto 1fr;
  height: var(--panel-height);
  width: var(--panel-width);
}

.title {
  display: flex;
  height: 40px;
  background-color: var(--grey);
  justify-content: center;
  align-items: center;
  border-radius: var(--panel-radius) var(--panel-radius) 0 0;
}

h1 {
  font-family: Courier, monospace;
  color: var(--orange);
  font-weight:bold;
  font-size:1.2em;
}

.list {
  flex: 1;
  overflow: auto;
}

.lineFriends {
  display: grid;
  grid-template-columns: 5fr 1fr 1fr;
}

.lineFriends span {
  display: flex;
  align-items: center;
  justify-content: center;
}

li {
  height: 40px;
  color:white;
  display: grid;
  grid-template-columns: 1fr;
  background-color: var(--li-one);
}

li:nth-child(2n + 1) {
  background-color: var(--li-two);
}

*::-webkit-scrollbar {
  display: none;
}

</style>
