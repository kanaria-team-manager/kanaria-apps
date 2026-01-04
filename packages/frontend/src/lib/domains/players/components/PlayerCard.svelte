<script lang="ts">
import { goto } from '$app/navigation';

interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  imageUrl?: string | null;
  teamId: string;
  tags?: string[];
}

let { player } = $props<{ player: Player }>();

let isMenuOpen = $state(false);

// Display name logic: prefer nickName, fallback to lastName + firstName
function getDisplayName(p: Player): string {
  if (p.nickName) return p.nickName;
  return `${p.lastName} ${p.firstName}`;
}

function getInitial(p: Player): string {
  if (p.nickName) return p.nickName.charAt(0);
  return p.lastName.charAt(0);
}

function toggleMenu(e: Event) {
  e.stopPropagation();
  isMenuOpen = !isMenuOpen;
}

function closeMenu() {
  isMenuOpen = false;
}

function navigateTo(e: Event, path: string) {
  e.stopPropagation();
  goto(path);
  closeMenu();
}
</script>

<div 
  class="group relative flex flex-col items-center bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-gray-200 transition-all duration-300 ease-out"
>
  <!-- Avatar -->
  <div class="relative mb-4">
    {#if player.imageUrl}
      <img 
        src={player.imageUrl} 
        alt={getDisplayName(player)} 
        class="w-20 h-20 rounded-full object-cover shadow-inner group-hover:scale-105 transition-transform duration-300"
      />
    {:else}
      <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center text-2xl font-bold text-indigo-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
        {getInitial(player)}
      </div>
    {/if}
    <!-- Status Dot (Mock) -->
    <div class="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></div>
  </div>

  <!-- Info -->
  <a href="/players/{player.id}" class="text-lg font-bold text-gray-900 mb-1 hover:text-indigo-600 transition-colors hover:underline">{getDisplayName(player)}</a>
  <p class="text-sm text-gray-400 mb-4">Player</p>

  <!-- Tags (Mock or Real) -->
  <div class="flex flex-wrap justify-center gap-2 mb-4">
    {#if player.tags && player.tags.length > 0}
      {#each player.tags as tag}
        <span class="px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
          {tag}
        </span>
      {/each}
    {:else}
      <span class="px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-400 rounded-lg border border-dashed border-gray-200">
        No Tags
      </span>
    {/if}
  </div>

  <!-- Action Button with Dropdown -->
  <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <button 
      onclick={toggleMenu}
      class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
      aria-label="Player options"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
    
    {#if isMenuOpen}
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 z-40" 
        onclick={closeMenu}
        role="presentation"
      ></div>
      
      <!-- Dropdown Menu -->
      <div class="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
        <button 
          onclick={(e) => navigateTo(e, `/players/${player.id}`)}
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          詳細
        </button>
        <button 
          onclick={(e) => navigateTo(e, `/players/${player.id}/edit`)}
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          編集
        </button>
      </div>
    {/if}
  </div>
</div>
