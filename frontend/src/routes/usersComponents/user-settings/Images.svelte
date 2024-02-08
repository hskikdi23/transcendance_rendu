<script lang="ts">
  import axios from "../../../axios.config";
  import { onMount } from "svelte";
  import { toast } from '@zerodevx/svelte-toast/dist'
  import { reloadImage } from "../../../stores";

  let fileInput: any = null;
  let images = [];

  onMount(() => getPPs());

  async function addPP() {
    const file = fileInput.files[0];
    if (file === null || file === undefined) {
      toast.push('Empty file', { classes: ['failure'] })
      return
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("/images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      getPPs();
      $reloadImage++;
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function getPPs() {
    try {
      const response = await axios.get('/images')
      images = response.data
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function updatePP(id: number) {
    try {
      await axios.patch(`/images/${id}`)
      $reloadImage++;
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  async function deletePP(id: number) {
    try {
      await axios.delete(`/images/${id}`)
      images = images.filter((image: any) => image.id !== id)
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

</script>

<div class="image">
    <h1>Change your pp</h1>
    <div class="image-list">
      {#each images as image}
      <div class="imageContainer">
        <div>
          <button class="hidden-button" on:click={() => updatePP(image.id)}>
            <img class="pp" src="{COMMON_BASE_URL}:3000/images/{image.id}" alt={image.name}/>
          </button>
        </div>
        <div class="imageButton">
          <button on:click={() => deletePP(image.id)}>delete</button>
        </div>
      </div>
      {/each}
      <form class="form" on:change|preventDefault={addPP}>
        <label for="file-upload">
          Add Image
          <input bind:this={fileInput} type="file" style="visibility: hidden;" id="file-upload"/>
        </label>
      </form>
    </div>
  </div>

<style>

  .image {
    min-width: 140px;
    min-height: 200px;
    width: 80%;
    height: 80%;
    place-self: center;
    overflow-y: auto;
    overflow-x: hidden;
  }

  h1 {
    color: var(--white);
    text-align: center;
  }

  .image-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    grid-gap: 1em;
    justify-items: center;
  }

  .image-list .pp {
    width: 100px;
    height: 100px;
    cursor: pointer;
  }

  form {
    height: 100px;
    width: 100px;
  }

  label {
    display: inline-block;
    width: 100px;
    height: 100px;
    border: solid 2px var(--black);
    cursor: crosshair;
    background-color: var(--white);
    font-size: 30px;
    text-align: center;
  }

  .image-list .pp:hover {
    -webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
    -moz-box-sizing: border-box; /* Firefox, other Gecko */
    box-sizing: border-box; /* Opera/IE 8+ */
    border: 2px solid #333;
  }

  .hidden-button {
    height: 100px;
    width: 100px;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .imageButton button {
    border: solid 1px black;
    background-color: white;
    border-radius: 10px;
    color: black;
    padding-left: 5px;
    padding-right: 5px;
  }

  @media screen and (max-width: 1200px) {
    .image {
    width: 250px;
    }
  }

</style>
