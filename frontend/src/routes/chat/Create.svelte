<script lang="ts">

  import type {ChannelDto } from "../../types";
  import axios from "../../axios.config";
  import { ChannelStatus } from '../../types';
  import { toast } from '@zerodevx/svelte-toast/dist'

  let channel: ChannelDto = {
    channelName: null,
    status: null,
    password: ''
  }

  // export let channels: any[]
  export let reloadChannels = async () => {}
  export let join: (channelName: string) => void;

  // TODO: ensure every socketio client leave the room before deleting the channel (cf. server.socketsLeave())
  async function remove(name: string) {
    if (!window.confirm("Are you sure ?"))
      return
    try {
      await axios.delete(`channel/${name}`, { withCredentials: true })
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function create() {
    if (!channel.channelName)
      return toast.push('Empty channel name', { classes: ['failure'] })
    if (!channel.status)
      return toast.push('Please select a status', { classes: ['failure'] })
    if (channel.status === ChannelStatus.Protected && channel.password === '')
      return toast.push('Empty channel password', { classes: ['failure'] })
    try {
      await axios.post('channel', channel, { withCredentials: true })
      await reloadChannels()
      join(channel.channelName);
    } catch (e) {
        toast.push(e.response.data.message, {classes: ['failure']})
    }
    channel.channelName = null
    channel.status = null
    channel.password = ''
  }

</script>

<div class="create-pannel">

  <div class="title">
    <h1>Create Channel</h1>
  </div>

  <div class="create">
    <fieldset>
      <input type="text" class="input input-sm inpput-bordered" bind:value={channel.channelName} placeholder="channel name">
      <br>
      <br>
      <select class="select select-sm select-bordered" bind:value={channel.status}>
        <option value={ChannelStatus.Public} selected>Public</option>
        <option value={ChannelStatus.Private}>Private</option>
        <option value={ChannelStatus.Protected}>Protected</option>
      </select>
      {#if channel.status == ChannelStatus.Protected}
        <br>
        <br>
        <input type="password" class="input input-sm input-bordered" bind:value={channel.password} placeholder="password">
      {/if}
      <br>
      <br>
      <button class="btn btn-sm" on:click={create}>Create</button>
    </fieldset>
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

.create {
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
