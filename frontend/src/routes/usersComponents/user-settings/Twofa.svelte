<script lang="ts">

import axios from "../../../axios.config";
import { user} from "../../../stores";
import { toast } from '@zerodevx/svelte-toast/dist'

  let qrcode: string = '';
  let code2FA: string = '';
  let steptwo: boolean = false;

  async function validate2FA() {
    try {
    await axios.post('/auth/2FA/validate', { token: code2FA })
    qrcode = ''
    code2FA = ''
    $user.TwoFA = true;
    steptwo = false;
    } catch (e) {
      toast.push('Bad 2FA code', { classes: ['failure'] })
    }
  }

  async function enable2FA() {
    try {
      const response = await axios.patch(`/auth/2FA/enable`, null)
      qrcode = response.data
      steptwo = true;
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function disable2FA() {
    try {
      await axios.patch(`/auth/2FA/disable`, null)
      $user.TwoFA = false;
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

</script>

  <div class="twofa">
    {#if $user.TwoFA === false && steptwo === false}
      <button on:click={enable2FA}>Enable TWOFA</button>
    {:else if qrcode !== ''}
      <img alt='qrcode' src={qrcode}>
      <input type="text" placeholder="code" bind:value={code2FA}>
      <button on:click={validate2FA}>Validate</button>
    {:else}
      <button on:click={disable2FA}>Disable TWOFA</button>
    {/if}
  </div>

<style>

  .twofa {
    display:flex ;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 250px;
    height: 280px;
    margin: auto;
  }

  .twofa img {
    width: 210px;
    height: 210px;
  }

</style>
