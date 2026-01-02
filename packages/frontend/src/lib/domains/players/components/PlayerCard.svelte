<script lang="ts">
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

// Display name logic: prefer nickName, fallback to lastName + firstName
function getDisplayName(p: Player): string {
  if (p.nickName) return p.nickName;
  return `${p.lastName} ${p.firstName}`;
}

function getInitial(p: Player): string {
  if (p.nickName) return p.nickName.charAt(0);
  return p.lastName.charAt(0);
}
</script>

<a href="/players/{player.id}" class="group relative flex flex-col items-center bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-gray-200 transition-all duration-300 ease-out cursor-pointer no-underline">
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
  <h3 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{getDisplayName(player)}</h3>
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

  <!-- Action Button (Hidden until hover) -->
  <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <button class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" aria-label="Player options">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
  </div>
</a>
