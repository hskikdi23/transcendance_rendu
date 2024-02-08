<script lang="ts">

  import { onMount } from "svelte";
  import axios from "../../../axios.config";
  import type { Match, Stat, User } from "../../../types";
  import { handleImageError } from "../../../utils";
  import { toast } from '@zerodevx/svelte-toast/dist';

  export let pageUser: User;
  let uservalue = pageUser.username;

  let opponent: any;
  let matchHistory: Match[] = [];

  let statistics: Stat = {
    lostGames: 0,
    wonGames: 0,
    totalGames: 0,
    ratioGames: 0,
    mmr: null,
    averageWin: { score: 0, opponentScore: 0 },
    averageLose: { score: 0, opponentScore: 0 },
    nbrOfFriends: 0,
  };

  $: {
    const newName  = pageUser.username;
    if (newName !== uservalue) {
      uservalue = pageUser.username;
      reload()
    }
  }

  onMount(async () => {
    reload();
  })

   async function reload() {
    await getMatchHistory()
    getStatistics()
   }

  const enum Tab {
    Statistics,
    GameHistory
  }

  let tab: Tab = Tab.Statistics

  async function getUsernameById(id: number) {
    try {
      const response = await axios.get(`/users/id/${id}`)
      return response.data.username;
    } catch (e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }

  function getStatistics() {
    const ranked = matchHistory.filter((match) => match.ranked === true);

    statistics.wonGames = ranked.filter((match) => match.winnerId == pageUser.id).length;
    statistics.lostGames = ranked.filter((match) => match.winnerId != pageUser.id).length;
    statistics.totalGames = ranked.length;

    // so we don't display 'NaN'
    if (statistics.totalGames !== 0) {
      statistics.ratioGames = +((statistics.wonGames / statistics.totalGames) *100).toFixed(2);
      statistics.averageWin.score = +(ranked.filter((match) => match.winnerId === pageUser.id)
      .reduce((sum, match) => sum + match.winnerScore, 0) /statistics.wonGames).toFixed(2);
      statistics.averageWin.opponentScore = +(ranked.filter((match) => match.winnerId === pageUser.id)
      .reduce((sum, match) => sum + match.loserScore, 0) / statistics.wonGames).toFixed(2);
      statistics.averageLose.score = +(ranked.filter((match) => match.winnerId != pageUser.id)
      .reduce((sum, match) => sum + match.loserScore, 0) /statistics.lostGames).toFixed(2);
      statistics.averageLose.opponentScore = +(ranked.filter((match) => match.winnerId != pageUser.id)
      .reduce((sum, match) => sum + match.winnerScore, 0) /statistics.lostGames).toFixed(2);
    }
  }

  async function getMatchHistory() {
    try {
      const response = await axios.get(`matchs/history/${pageUser.id}`)
      matchHistory = response.data
    } catch(e) {
      toast.push(e.response.data.message, {classes: ['failure']})
    }
  }


</script>

<div class="box-info">
  <div class="nav">
    <button on:click={() => tab = Tab.Statistics} class={tab === Tab.Statistics ? 'activeButton left' : 'left'}>Statistics</button>
    <button on:click={() => tab = Tab.GameHistory} class={tab === Tab.GameHistory ? 'activeButton right' : 'right'}>Game History</button>
  </div>
  {#if tab === Tab.Statistics}
  <div class='overflow'>
    <div class="stat-grid">
      <div class="tiles">
        <h2>Total games</h2>
        <div class="value">
          <span>{statistics.totalGames}</span>
        </div>
      </div>
      <div class="tiles lite">
        <h2>Won games</h2>
        <div class="value">
          <span>{statistics.wonGames}</span>
        </div>
      </div>
      <div class="tiles lite">
        <h2>Lost games</h2>
        <div class="value">
          <span>{statistics.lostGames}</span>
        </div>
      </div>
      <div class="tiles">
        <h2>Ratio</h2>
        <div class="value">
          <span>{statistics.ratioGames}</span>
        </div>
      </div>
      <div class="tiles">
        <h2>Average win</h2>
        <div class="value">
          <span>{statistics.averageWin.score}-{statistics.averageWin.opponentScore}</span>
        </div>
      </div>
      <div class="tiles lite">
        <h2>Average lose</h2>
        <div class="value">
          <span>{statistics.averageLose.score}-{statistics.averageLose.opponentScore}</span>
        </div>
      </div>
    </div>
  </div>
  {:else}
  <div class="overflow">
    <ul>
      {#each matchHistory as match}
        {#if match.winnerId == pageUser.id}
          <li class="lineFriends" id="win">
            <span> <span class="greenDot" /></span>
            <span>{match.winnerScore}</span>
            <span>-</span>
            <span>{match.loserScore}</span>
            <span>
              <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{match.loserId}" on:error={handleImageError} alt="pp"/>
            </span>
            <span id="flexStart">
              {#await (opponent = getUsernameById(match.loserId))}
                ...
              {:then opponent}
                <a href="#/users/{opponent}">{opponent}</a>
              {/await}
            </span>
            {#if match.ranked}
              <span>
                <div class="badge badgs-xs badge-ghost">
                  ranked
                </div>
              </span>
            {:else}
              <span />
            {/if}
          </li>
        {:else}
          <li class="lineFriends" id="lose">
            <span> <span class="redDot" /></span>
            <span>{match.loserScore} </span>
            <span>-</span>
            <span>{match.winnerScore}</span>
            <span>
              <img class="pp" src="{COMMON_BASE_URL}:3000/images/actual/{match.winnerId}" on:error={handleImageError} alt="pp"/>
            </span>
            <span id="flexStart">
              {#await (opponent = getUsernameById(match.winnerId))}
                ...
              {:then opponent}
                <a href="#/users/{opponent}">{opponent}</a>
              {/await}
            </span>
            {#if match.ranked}
              <span>
                <div class="badge badgs-xs badge-ghost">
                  ranked
                </div>
              </span>
            {:else}
              <span />
            {/if}
          </li>
        {/if}
      {/each}
    </ul>
  </div>
  {/if}
</div>

<style>

.stat-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

.stat-grid .tiles:last-child {
  border-radius: 0 0 var(--panel-radius) 0;
}

.stat-grid .tiles {
  position: relative;
  background-color: var(--li-two);
}

.stat-grid .lite {
  background-color: var(--li-one);
}

.stat-grid .tiles h2 {
  position: absolute;
  text-align: center;
  color: var(--lite-lite-lite-grey);
}

.stat-grid .tiles .value {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-grid .tiles .value span {
  font-size: 3em;
}

.box-info .nav button:not(:last-child) {
  border-right: solid 1px var(--black);
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

.box-info .pp {
  width: 35px;
  height: 35px;
  border: 1px solid rgb(78, 78, 78);
  border-radius: 50%;
}

.lineFriends {
  display: grid;
  grid-template-columns: 1fr 0.3fr 0.3fr 0.3fr 1fr 3fr 1fr;
}

.lineFriends span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lineFriends #flexStart {
  justify-content: flex-start;
}

.lineFriends .redDot {
  height: 25px;
  width: 25px;
  background-color: #e30613;
  border-radius: 50%;
  border: solid 1px black;
}

.lineFriends .greenDot {
  height: 25px;
  width: 25px;
  background-color: #068f3a;
  border-radius: 50%;
  border: solid 1px black;
}

*::-webkit-scrollbar {
  display: none;
}

</style>
