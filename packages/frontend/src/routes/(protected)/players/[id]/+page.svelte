<script lang="ts">
  interface PlayerTag {
    id: string;
    name: string;
  }

  interface ParentUser {
    id: string;
    name: string | null;
  }

  interface Player {
    id: string;
    lastName: string;
    firstName: string;
    nickName?: string | null;
    imageUrl?: string | null;
    teamId: string;
    parentUserId: string;
    createdAt: string;
    updatedAt: string;
    tags: PlayerTag[];
    parentUser: ParentUser | null;
  }

  const { data } = $props();

  // Use data from load function
  const player = data.player as Player | null;
  const error = data.error as string | undefined;

  function getDisplayName(p: Player): string {
    if (p.nickName) return p.nickName;
    return `${p.lastName} ${p.firstName}`;
  }

  function getInitial(p: Player): string {
    if (p.nickName) return p.nickName.charAt(0);
    return p.lastName.charAt(0);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/players" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      一覧に戻る
    </a>
  </div>

  {#if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else if player}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="relative bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
        <div class="absolute top-4 right-4">
          <a 
            href="/players/{player.id}/edit"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            編集
          </a>
        </div>
        
        <div class="flex items-center gap-6">
          {#if player.imageUrl}
            <img 
              src={player.imageUrl} 
              alt={getDisplayName(player)} 
              class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
          {:else}
            <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white shadow-md">
              {getInitial(player)}
            </div>
          {/if}
          
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{getDisplayName(player)}</h1>
            {#if player.nickName}
              <p class="text-gray-500">{player.lastName} {player.firstName}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Tags -->
        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">タグ</h3>
          <div class="flex flex-wrap gap-2">
            {#if player.tags && player.tags.length > 0}
              {#each player.tags as tag}
                <span class="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg">
                  {tag.name}
                </span>
              {/each}
            {:else}
              <span class="text-gray-400 text-sm">タグなし</span>
            {/if}
          </div>
        </div>
        
        <!-- Parent User -->
        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">保護者</h3>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span class="font-medium text-gray-700">
              {player.parentUser?.name || '不明'}
            </span>
          </div>
        </div>
        
        <!-- Metadata -->
        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">作成日</h3>
            <p class="text-sm text-gray-700">{formatDate(player.createdAt)}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">更新日</h3>
            <p class="text-sm text-gray-700">{formatDate(player.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      選手情報が見つかりませんでした
    </div>
  {/if}
</div>
