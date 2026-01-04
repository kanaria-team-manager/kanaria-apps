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

type ViewMode = 'card' | 'list';

// Props
let { initialPlayers = [], session }: { initialPlayers?: Player[], session: Session } = $props();

// State
let players = $state(initialPlayers);
let searchQuery = $state("");
let isLoading = $state(false);
let activeFilterId = $state(""); // Empty string means "All"
let gradeTags = $state<Tag[]>([]);
let viewMode = $state<ViewMode>('card');
let openMenuId = $state<string | null>(null);

function toggleListMenu(e: Event, playerId: string) {
  e.stopPropagation();
  e.preventDefault();
  openMenuId = openMenuId === playerId ? null : playerId;
}

function closeListMenu() {
  openMenuId = null;
}

// Debounce Search
let searchTimeout: ReturnType<typeof setTimeout>;

// Display name logic
function getDisplayName(p: Player): string {
  if (p.nickName) return p.nickName;
  return `${p.lastName} ${p.firstName}`;
}

function getInitial(p: Player): string {
  if (p.nickName) return p.nickName.charAt(0);
  return p.lastName.charAt(0);
}

onMount(async () => {
    try {
        gradeTags = await fetchGradeTags(window.fetch, session?.access_token);
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

function toggleViewMode() {
  viewMode = viewMode === 'card' ? 'list' : 'card';
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
      <!-- View Toggle -->
      <div class="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onclick={() => viewMode = 'card'}
          class="p-2 rounded-md transition-colors {viewMode === 'card' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}"
          aria-label="カード表示"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"/>
            <rect width="7" height="7" x="14" y="3" rx="1"/>
            <rect width="7" height="7" x="14" y="14" rx="1"/>
            <rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
        </button>
        <button
          onclick={() => viewMode = 'list'}
          class="p-2 rounded-md transition-colors {viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}"
          aria-label="リスト表示"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" x2="21" y1="6" y2="6"/>
            <line x1="8" x2="21" y1="12" y2="12"/>
            <line x1="8" x2="21" y1="18" y2="18"/>
            <line x1="3" x2="3.01" y1="6" y2="6"/>
            <line x1="3" x2="3.01" y1="12" y2="12"/>
            <line x1="3" x2="3.01" y1="18" y2="18"/>
          </svg>
        </button>
      </div>

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

  <!-- Content -->
  {#if isLoading}
    {#if viewMode === 'card'}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {#each Array(4) as _}
          <div class="h-64 bg-gray-100 rounded-2xl"></div>
        {/each}
      </div>
    {:else}
      <div class="space-y-2 animate-pulse">
        {#each Array(6) as _}
          <div class="h-16 bg-gray-100 rounded-xl"></div>
        {/each}
      </div>
    {/if}
  {:else if players.length > 0}
    {#if viewMode === 'card'}
      <!-- Card View -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each players as player (player.id)}
          <PlayerCard {player} />
        {/each}
      </div>
    {:else}
      <!-- List View -->
      <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">選手</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">タグ</th>
              <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            {#each players as player (player.id)}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    {#if player.imageUrl}
                      <img 
                        src={player.imageUrl} 
                        alt={getDisplayName(player)} 
                        class="w-10 h-10 rounded-full object-cover"
                      />
                    {:else}
                      <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-600">
                        {getInitial(player)}
                      </div>
                    {/if}
                    <div>
                      <a href="/players/{player.id}" class="font-medium text-gray-900 hover:underline hover:text-indigo-600">{getDisplayName(player)}</a>
                      {#if player.nickName}
                        <p class="text-xs text-gray-400">{player.lastName} {player.firstName}</p>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 hidden sm:table-cell">
                  <div class="flex flex-wrap gap-1">
                    {#if player.tags && player.tags.length > 0}
                      {#each player.tags as tag}
                        <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      {/each}
                    {:else}
                      <span class="text-xs text-gray-400">-</span>
                    {/if}
                  </div>
                </td>
                <td class="py-3 px-4 text-right relative">
                  <button 
                    onclick={(e) => toggleListMenu(e, player.id)}
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                    aria-label="Player options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                  
                  {#if openMenuId === player.id}
                    <!-- Backdrop -->
                    <div 
                      class="fixed inset-0 z-40" 
                      onclick={closeListMenu}
                      role="presentation"
                    ></div>
                    
                    <!-- Dropdown Menu -->
                    <div class="absolute right-4 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <a 
                        href="/players/{player.id}"
                        class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
                        onclick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        詳細
                      </a>
                      <a 
                        href="/players/{player.id}/edit"
                        class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
                        onclick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        編集
                      </a>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
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
