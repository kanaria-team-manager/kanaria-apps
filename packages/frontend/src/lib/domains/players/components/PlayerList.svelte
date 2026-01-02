<script lang="ts">
import { apiGet } from "$lib/api/client";
import { fetchGradeTags } from "$lib/api/master";
import type { Tag } from "@kanaria/shared";
import type { Session } from "@supabase/supabase-js";
import { onMount } from "svelte";
import PlayerCard from "./PlayerCard.svelte";

// Types
interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  imageUrl?: string | null;
  teamId: string;
  tags?: string[];
}

// Props
let { initialPlayers = [], session }: { initialPlayers?: Player[], session: Session } = $props();

// State
let players = $state(initialPlayers);
let searchQuery = $state("");
let isLoading = $state(false);
let activeFilterId = $state(""); // Empty string means "All"
let gradeTags = $state<Tag[]>([]);

// Debounce Search
let searchTimeout: ReturnType<typeof setTimeout>;

onMount(async () => {
    try {
        gradeTags = await fetchGradeTags(window.fetch);
    } catch (e) {
        console.error("Failed to fetch grade tags", e);
    }
});

async function fetchPlayers() {
  isLoading = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (activeFilterId) params.append("tagIds", activeFilterId);

    players = await apiGet<Player[]>(`/players?${params.toString()}`, session?.access_token);
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

function handleFilter(tagId: string) {
    activeFilterId = tagId;
    fetchPlayers();
}

function handleRefresh() {
  fetchPlayers();
}
</script>

<div class="space-y-8">
  <!-- Header / Controls -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">選手一覧</h2>
      <p class="text-gray-500">チームの選手を管理して表示します</p>
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
          placeholder="選手を検索..."
          bind:value={searchQuery}
          oninput={handleSearch}
          class="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64 shadow-sm"
        />
      </div>
    </div>
  </div>

  <!-- Filters (Tabs) -->
  <div class="flex items-center gap-2 border-b border-gray-100 pb-1 overflow-x-auto">
    <button 
      onclick={() => handleFilter("")}
      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap {activeFilterId === "" ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}"
    >
      全て
    </button>
    {#each gradeTags as tag}
      <button 
        onclick={() => handleFilter(tag.id)}
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap {activeFilterId === tag.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}"
      >
        {tag.name}
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
      <h3 class="text-lg font-semibold text-gray-900">選手が見つかりませんでした</h3>
      <p class="text-gray-500 mt-1 max-w-xs text-center">検索またはフィルターを調整して探しているものを見つけることができます。</p>
      {#if searchQuery}
        <button 
          onclick={() => { searchQuery = ''; handleRefresh(); }} 
          class="mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700"
        >
          検索をクリアする
        </button>
      {/if}
    </div>
  {/if}

</div>
