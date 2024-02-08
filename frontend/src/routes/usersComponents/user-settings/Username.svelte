<script lang="ts">
  import axios from "../../../axios.config";
  import { user } from "../../../stores";
  import { replace } from "svelte-spa-router";
  import { toast } from '@zerodevx/svelte-toast/dist'

  let username: string = null;

  async function updateUsername() {

    if (username === null) {
      toast.push('Empty username', { classes: ['failure'] })
      return
    }

   if (username.length > 21) {
      toast.push('Username too long (21 chars max)', { classes: ['failure'] })
      return
    }

    if (username === $user.username) {
      toast.push('Same username', { classes: ['failure'] })
      return
    }

    try {
      await axios.patch("/users/username", { username: username });
      toast.push('Username successfully updated!', { classes: ['success'] })
      $user.username = username;
      username = null;
      replace(`/users/${$user.username}`);
    } catch (e) {
      toast.push(e.response.data.message, { classes: ['failure'] })
    }
  }

</script>

<div class="overflow">
  <br>
  <br>
  <h1>Change your username</h1>
  <br>
  <br>
  <div class="content">
    <input bind:value={username} type="text" placeholder="new username" class="input input-sm input-bordered" />
    <button class="btn btn-sm" on:click={() => updateUsername()}>Update</button>
  </div>
</div>

<style>

  h1 {
    color: var(--white);
    text-align: center;
  }

  .overflow {
    place-self: center;
    flex: 1;
  }

</style>
