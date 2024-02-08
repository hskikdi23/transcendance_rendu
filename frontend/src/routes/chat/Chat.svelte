<script lang="ts">
  import axios from "../../axios.config";
  import PublicView from "./PublicView.svelte";
  import Create from "./Create.svelte";
  import DirectMessage from "./DirectMessage.svelte";
  import Channel from "./Channel.svelte";
  import { toast } from '@zerodevx/svelte-toast/dist'

  let channels: any[] = [];

  async function getAllChannels() {
    try {
      const response = await axios.get('/channel')
      channels = response.data
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  };

  let chanjoined: string = '';
  let triggerCount: number = 0;

  function joinChannel(channelName: string) {
    chanjoined  = channelName;
    triggerCount++;
  };


</script>

  <h1>Chat</h1>

  {#await getAllChannels() then _}

  <div class="component">

    <DirectMessage/>

    <Channel bind:channels reloadChannels={getAllChannels} joinChan={chanjoined} count={triggerCount}/>

    <Create reloadChannels={getAllChannels} join={joinChannel}/>

    <PublicView bind:channels reloadChannels={getAllChannels} join={joinChannel}/>

  </div>

  {/await}

<style>

  h1 {
    margin-top:1em;
    text-shadow:  0 0 10px ;
    color: var(--pink);
    font-size: 2em;
    font-weight: bold;
    margin-bottom:2em;
    text-align: center;
  }

  .component {
    height: 75%;
    display: grid;
    place-items: center;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-auto-rows: 500px;
    grid-auto-columns: 500px;
    overflow-y: scroll;
  }

  @media screen and (max-width: 1300px) {
    .component {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }
  }


</style>
