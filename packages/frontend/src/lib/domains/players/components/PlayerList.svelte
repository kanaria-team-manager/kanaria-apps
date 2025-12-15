<script lang="ts">
  import { onMount } from "svelte";
  import PlayerCard from "./PlayerCard.svelte";

  // Types
  interface Player {
    id: string;
    name: string;
    teamId: string;
  }

  // Props
  export let initialPlayers: Player[] = [];
  
  // State
  let players = initialPlayers;
  let searchQuery = "";
  let isLoading = false;
  let activeFilter = "all";

  // Debounce Search
  let searchTimeout: NodeJS.Timeout;

  async function fetchPlayers() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      // if (activeFilter !== 'all') params.append('tag', activeFilter);

      const res = await fetch(`/players?${params.toString()}`);
      if (res.ok) {
        players = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch players", err);
    } finally {
      isLoading = false;
    }
  }

  function handleSearch(e: Event) {
    const target = e.target as HTMLInputElement;
    searchQuery = target.value;
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchPlayers, 300);
  }

  function handleRefresh() {
    fetchPlayers();
  }
</script>

<div class="space-y-8">
  <!-- Header / Controls -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Team Players</h2>
      <p class="text-gray-500">Manage and view your team roster</p>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search -->
      <div class="relative group">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search players..."
          bind:value={searchQuery}
          on:input={handleSearch}
          class="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64 shadow-sm"
        />
      </div>

      <!-- Add Button -->
      <!-- <button class="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl shadow-lg shadow-gray-900/10 transition-all active:scale-95 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Player
      </button> -->
    </div>
  </div>

  <!-- Filters (Tabs) -->
  <div class="flex items-center gap-2 border-b border-gray-100 pb-1 overflow-x-auto">
    {#each ['All', 'Active', 'Injured', 'Archived'] as tab}
      <button 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap {activeFilter.toLowerCase() === tab.toLowerCase() || (activeFilter === 'all' && tab === 'All') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}"
      >
        {tab}
      </button>
    {/each}
  </div>

  <!-- Grid -->
  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
      {#each Array(4) as _}
        <div class="h-64 bg-gray-100 rounded-2xl"></div>
      {/each}
    </div>
  {:else if players.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each players as player (player.id)}
        <PlayerCard {player} />
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
      <div class="p-4 bg-white rounded-2xl shadow-sm mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">No players found</h3>
      <p class="text-gray-500 mt-1 max-w-xs text-center">Try adjusting your search or filters to find what you're looking for.</p>
      {#if searchQuery}
        <button 
          on:click={() => { searchQuery = ''; handleRefresh(); }} 
          class="mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700"
        >
          Clear search
        </button>
      {/if}
    </div>
  {/if}

</div>
