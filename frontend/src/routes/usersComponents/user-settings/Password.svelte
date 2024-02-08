<script lang="ts">
  import axios from "../../../axios.config";
  import { user } from "../../../stores";
  import { replace } from "svelte-spa-router";
  import { toast } from "@zerodevx/svelte-toast/dist";

  let password: string = null;

  async function updatePassword() {
    if (password === null) {
      toast.push('Empty password', { classes: ['failure'] })
      return
    }
    try {
      await axios.patch("/users/password", { password: password });
      toast.push('Password successfully updated!', { classes: ['success'] })
      $user.password = password;
      password = null;
      replace(`/users/${$user.username}`);
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

</script>

<div class="overflow">
  <br>
  <br>
  <h1>Change your password</h1>
  <br>
  <br>
  <div class="content">
    <input bind:value={password} type="text" placeholder="new password" class="input input-sm input-bordered" />
    <button class="btn btn-sm" on:click={() => updatePassword()}>Update</button>
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
