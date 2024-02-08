<script lang="ts">
	import axios from "../axios.config";
	import { onMount } from "svelte";
  import { handleImageError } from "../utils";
  import { toast } from '@zerodevx/svelte-toast/dist'

	// TODO: get rid of unused `User` fields
	let users = [];

  const pageLength = 10
  let page = 1
  let totalPages: number
  let pagesArray: Array<number> = []

	onMount(() => getUsers());

	async function getUsers() {
		try {
			const response = await axios.get("/users");
      users = response.data;
      totalPages = users.length / pageLength + 1
      pagesArray = Array.from({length: totalPages}, (x, i) => i+1)
			sortByMMR();
		} catch (e) {
			toast.push(e.response.data.messsage, { classes: ['failure'] });
		}
	}

	function sortByMMR() {
		users.sort((a, b) => b.mmr - a.mmr);
		users = users; // svelte reload
	}

	function sortByGames() {
		users.sort((a, b) => b.games - a.games);
		users = users; // svelte relaod
	}

</script>


<div class="component">

	<h1>Leaderboard</h1>
	
	<table>
		<thead>
			<tr class="titles">
				<th class="title">Rank</th>
				<th class="title">User</th>
				<th class="title"><a class="clickable" href="/#/leaderboard" on:click={() => sortByMMR()}>Mmr</a></th>
				<th class="title"><a class="clickable" href="/#/leaderboard" on:click={() => sortByGames()}>Games</a></th>
			</tr>
		</thead>
		<tbody>
			{#each users as user, i}
			{#if i >= (page-1) * pageLength && i < page * pageLength}
			<tr>
				<td>{i + 1}</td>
				<td>
					<a href="#/users/{user.username}">
						<span class="user">
							<img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{user.id}" on:error={handleImageError} alt="pp"/>
							<p class="username">{user.username}</p>
						</span>
					</a>
				</td>
				<td>{user.mmr}</td>
				<td>{user.games}</td>
			</tr>
			{/if}
			{/each}
		</tbody>
	</table>
	
	<br>
	<br>
	
	<div class="join">
		{#each pagesArray as _page}
		<button on:click={() => page = _page} class="join-item btn">{_page}</button>
		{/each}
	</div>
</div>
	
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
		
		table {
			color:white;
			margin: auto;
			border-collapse: collapse;
			border-radius: 1em;
			overflow: hidden;
			font-size:1.2em;
		}

  .join {
		text-align: center;
  }

  .titles {
		color: var(--orange);
    font-family: Courier, monospace;
  }

  .title {
    background-color:var(--grey);
  }

	td {
		text-align: center;
	}

	td, th {
		border-bottom: 1px solid #303030;
    background-color:var(--lite-grey);
		padding-left: 2em;
		padding-right: 2em;
    padding-top:0.2em;
    padding-bottom:0.2em;
	}

	tr:nth-child(even) {
		background-color: #eee;
	}

	.clickable:hover {
    text-decoration:underline;
	}

	.user:hover {
    text-decoration:underline;
	}

	tbody tr:nth-child(1) > td:nth-child(1) {
		background-color: gold;
	}

	tbody tr:nth-child(2) td:nth-child(1) {
		background-color: silver;
	}

	tbody tr:nth-child(3) td:nth-child(1) {
		background-color: sienna;
	}

	.user {
		display: flex;
		align-items: center;
	}

	.pp {
		width: 40px;
		height: 40px;
		border: 1px solid rgb(78, 78, 78);
		border-radius: 50%;
	}

	.username {
		padding-left: 10px;
	}

	.component {
    height: 100%;
    overflow-y: scroll;
  }

</style>