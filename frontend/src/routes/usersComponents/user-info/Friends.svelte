<script lang="ts">

  import axios from "../../../axios.config";
  import { id, socket } from "../../../stores";
  import type { User } from "../../../types";
  import deleteIcon from "../../../assets/new_cross.png";
  import acceptIcon from "../../../assets/new_check.png";
  import { handleImageError } from "../../../utils";
  import { toast } from '@zerodevx/svelte-toast/dist';

  export let pageUser: User;

  const enum Tab {
    Friends,
    Request,
    Pending,
    Blocked
  }

  let tab: Tab = Tab.Friends

  async function removeFriendByName(name: string) {
    try {
      await axios.post(`/users/friendship/removeByName/${name}`,null);

      let index = pageUser.friends.findIndex(friend => friend.username === name)
      if (index !== -1)
        pageUser.friends.splice(index, 1)

      index = pageUser.friendOf.findIndex(friend => friend.username === name)
      if (index !== -1)
        pageUser.friendOf.splice(index, 1)

      pageUser = pageUser

      $socket.emit('removeFriend', name)
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function acceptFriendshipRequestByName(name: string) {
    try {
      const response = await axios.post(`/users/friendship/acceptByName/${name}`, null);

      const index = pageUser.requestFriends.findIndex(friend => friend.username === name)
      if (index !== -1)
        pageUser.requestFriends.splice(index, 1)

      const friend = response.data.friends.find((friend: any) => friend.username === name)
      pageUser.friends.unshift({ id: friend.id, username: name })

      pageUser = pageUser

      $socket.emit('acceptFriend', name)
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function dismissFriendshipRequestByName(name: string) {
    try {
      await axios.post(`/users/friendship/dismissByName/${name}`, null);

      const index = pageUser.requestFriends.findIndex(friend => friend.username === name)
      if (index !== -1)
        pageUser.requestFriends.splice(index, 1)

      pageUser = pageUser

      $socket.emit('dismissFriend', name)
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function cancelFriendshipRequestByName(name: string) {
    try {
      await axios.post(`/users/friendship/cancelByName/${name}`,null);

      const index = pageUser.pendingFriends.findIndex(friend => friend.username === name)
      if (index !== -1)
        pageUser.pendingFriends.splice(index, 1)

      pageUser = pageUser

      $socket.emit('cancelFriend', pageUser.username)
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function unblockByUsername(username: string) {
    try {
      await axios.patch(`/users/unblock/${username}`, null);
      const index = pageUser.blocked.findIndex(_user => _user.username === username)
      if (index !== -1)
        pageUser.blocked.splice(index, 1)
      pageUser = pageUser
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

</script>

<div class="box-info">
    {#if $id === pageUser.id.toString()}
      <div class="nav">
        <button on:click={() => tab = Tab.Friends} class={tab === Tab.Friends ? 'activeButton left' : 'left'}>Friends</button>
        <button on:click={() => tab = Tab.Request} class={tab === Tab.Request ? 'activeButton' : undefined}>Request</button>
        <button on:click={() => tab = Tab.Pending} class={tab === Tab.Pending ? 'activeButton' : undefined}>Pending</button>
        <button on:click={() => tab = Tab.Blocked} class={tab === Tab.Blocked ? 'activeButton right' : 'right'}>Blocked</button>
      </div>
    {:else}
      <h2>Friends</h2>
    {/if}

    {#if tab === Tab.Friends}
      <div class="overflow">
        <ul>
          {#each pageUser.friends as friend}
            <li>
              <div class="user">
                <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{friend.id}" on:error={handleImageError} alt="pp"/>
                <a class="name" href="#/users/{friend.username}">{friend.username}</a>
              </div>
              {#if $id === pageUser.id.toString()}
                <div class="actions">
                  <button class="actionsButton"
                    on:click={() => removeFriendByName(friend.username)}>
                    <img class="btnImage" src={deleteIcon} alt="deleteicon"/>
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {:else if tab === Tab.Request && $id === pageUser.id.toString()}
      <div class="overflow">
        <ul>
          {#each pageUser.requestFriends as requestFriends}
            <li>
              <div class="user">
                <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{requestFriends?.id}" on:error={handleImageError} alt="pp"/>
                <a class="name" href="#/users/{requestFriends?.username}">
                  {requestFriends?.username}
                </a>
              </div>
              <div class="actions">
                <button class="actionsButton"
                  on:click={() => acceptFriendshipRequestByName(requestFriends.username)}>
                  <img class="btnImage" src={acceptIcon} alt="accept" />
                </button>
                <button class="actionsButton"
                  on:click={() => dismissFriendshipRequestByName(requestFriends.username)}>
                  <img class="btnImage" src={deleteIcon} alt="delete" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {:else if tab === Tab.Pending && $id === pageUser.id.toString()}
      <div class="overflow">
        <ul>
          {#each pageUser.pendingFriends as pendingFriends}
            <li>
              <div class="user">
                <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{pendingFriends?.id}" on:error={handleImageError} alt="pp"/>
                <a class="name" href="#/users/{pendingFriends?.username}">
                  {pendingFriends?.username}</a>
              </div>
              <div class="actions">
                <button
                  class="actionsButton"
                  on:click={() => cancelFriendshipRequestByName(pendingFriends.username)}>
                  <img class="btnImage" src={deleteIcon} alt="delete" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {:else if tab === Tab.Blocked && $id === pageUser.id.toString()}
      <div class="overflow">
        <ul>
          {#each pageUser.blocked as blocked}
            <li>
              <div class="user">
                <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{blocked.id}" on:error={handleImageError} alt="pp"/>
                <a class="name" href="#/users/{blocked.username}"> {blocked.username}</a>
              </div>
              {#if $id === pageUser.id.toString()}
                <div class="actions">
                  <button class="actionsButton"
                    on:click={() => unblockByUsername(blocked.username)}>
                    <img class="btnImage" src={deleteIcon} alt="deleteicon"/>
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

<style>

  .pp {
    width: 35px;
    height: 35px;
    border: 1px solid rgb(78, 78, 78);
    border-radius: 50%;
  }

  /* same into Pong.svelte */
  h2 {
    font-family: Courier, monospace;
    border-top-right-radius:10px;
    border-top-left-radius:10px;
    background-color:var(--grey);
    font-size:1.3em;
    color:var(--orange);
    font-weight:bold;
    margin-bottom:1em;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  li {
    height: 40px;
    display: grid;
    grid-template-columns: 2fr 1fr;
    background-color: var(--li-one);
  }

  li:nth-child(2n + 1) {
    background-color: var(--li-two);
  }

  .box-info .user {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 5%;
  }

  .box-info .user .name {
    margin-left: 5%;
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    margin-right: 5%;
    gap: 5px;
  }

  .box-info .nav button:not(:last-child) {
    border-right: solid 1px var(--black);
  }

  .actionsButton {
    background-color: var(--white);
    border: solid 2px black;
    border-radius: 50%;
    height: 35px;
    width: 35px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
  }

  .btnImage {
    height: 25px;
    width: 25px;
  }

  *::-webkit-scrollbar {
    display: none;
  }

</style>
