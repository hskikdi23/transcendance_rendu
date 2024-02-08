<script lang="ts">
  import axios from "../axios.config";
  import { id, user, socket } from "../stores";
  import type { Status, User } from "../types";
  import Friends from "./usersComponents/user-info/Friends.svelte";
  import Stats from "./usersComponents/user-info/Stats.svelte";
  import Settings from "./usersComponents/user-info/Settings.svelte";
  import Infos from "./usersComponents/user-info/Infos.svelte";
  import { toast } from '@zerodevx/svelte-toast/dist'
  import { onMount } from "svelte";
  import ioClient from 'socket.io-client';

  export let params: any;

  let isBlocked: boolean = false;
  let onlineStatus: Status = null;

  let pageUser: User = {
    id: 0,
    username: null,
    password: null,
    mmr: null,
    games: null,
    ft_login: null,
    blocked: [],
    blockedBy: [],
    friends: [],
    friendOf: [],
    pendingFriends: [],
    requestFriends: [],
    TwoFA: false,
    date: null,
  };

  $: {
    if (params != undefined)
    {
      const { newName } = params.name;
      if (newName !== name) {
        selectprofile();
      }
    }
  }

  async function selectprofile() {

    if (params == undefined || params.name === $user.username) {
      pageUser = $user
      return
    }

    try {

      // get user
      const response = await axios.get(`/users/${params.name}`)
      pageUser = response.data

      // get online status
      $socket.emit('getOnlineStatus', pageUser.username, (response: Status) => {
        onlineStatus = response
      })

      // get blocked status
      isBlocked = pageUser.blockedBy.some(blocked => blocked.id.toString() === $id)
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  onMount(() => {

    try {
      $socket = ioClient(axios.defaults.baseURL, {
        path: '/user',
        withCredentials: true,
        query: { id: $user.id, username: $user.username }
      })
    } catch(e) {
      console.log(e)
      return
    }

    $socket.on('requestFriend', (response: any) => {
      toast.push(`friend request received from ${response.username}`)
      $user.requestFriends.push({ id: response.id, username: response.username })
      if (pageUser.id.toString() === response.id) {
        pageUser.pendingFriends.push({ id: response.id, username: response.username })
        pageUser = pageUser
      }
    })

    $socket.on('acceptFriend', (id: string, username: string) => {
      console.log('accept', $socket.id)
      toast.push(`${username} accepted your friend request !`)
      const toDelete = $user.pendingFriends.findIndex(pending => pending.id === +id)
      if (toDelete !== -1)
        $user.pendingFriends.splice(toDelete, 1)
      $user.friends.push({ id: +id, username: username })
      $user.friendOf.push({ id: +id, username: username })
      if (pageUser.id.toString() === id) {
        const toDelete = pageUser.requestFriends.findIndex(request => request.id === $user.id)
        if (toDelete !== -1)
          pageUser.requestFriends.splice(toDelete, 1)
        pageUser.friends.push({ id: $user.id, username: $user.username })
        pageUser.friendOf.push({ id: $user.id, username: $user.username })
        pageUser = pageUser
      }
    })

    $socket.on('removeFriend', (id: string, username: string) => {
      toast.push(`${username} removed you from his friends...`)
      let toDelete = $user.friends.findIndex(friend => friend.id === +id)
      if (toDelete !== -1)
        $user.friends.splice(toDelete, 1)
      toDelete = $user.friendOf.findIndex(friend => friend.id === +id)
      if (toDelete !== -1)
        $user.friendOf.splice(toDelete, 1)
      if (pageUser.id.toString() === id) {
        toDelete = pageUser.friends.findIndex(friend => friend.id === $user.id)
        if (toDelete !== -1)
          pageUser.friends.splice(toDelete, 1)
        toDelete = pageUser.friendOf.findIndex(friend => friend.id === $user.id)
        if (toDelete !== -1)
          pageUser.friendOf.splice(toDelete, 1)
        pageUser = pageUser
      }
    })

    $socket.on('dismissFriend', (id: string, username: string) => {
      toast.push(`${username} dismissed your friend request...`)
      let toDelete = $user.pendingFriends.findIndex(friend => friend.id === +id)
      if (toDelete !== -1)
        $user.pendingFriends.splice(toDelete, 1)
      if (pageUser.id === +id) {
        toDelete = pageUser.requestFriends.findIndex(friend => friend.id === $user.id)
        if (toDelete !== -1)
          pageUser.requestFriends.splice(toDelete, 1)
        pageUser = pageUser
      }
    })

    $socket.on('cancelFriend', (id: string, username: string) => {
      toast.push(`${username} canceled his friend request...`)
      const toDelete = $user.requestFriends.findIndex(friend => friend.id.toString() === id)
      if (toDelete !== -1)
        $user.requestFriends.splice(toDelete, 1)
    })

  })

</script>

{#await selectprofile() then _}

<div class="component">

  <Infos bind:pageUser bind:onlineStatus bind:isBlocked/>

  <Friends bind:pageUser/>

  <Stats bind:pageUser/>

  {#if pageUser.id.toString() === $id}
    <Settings bind:pageUser/>
  {/if}

</div>

{/await}

<style>

  .component {
    height: 100%;
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
