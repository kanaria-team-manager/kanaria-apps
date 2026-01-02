<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { apiGet, apiPut } from '$lib/api/client';
  import { fetchGradeTags } from '$lib/api/master';
  import type { Tag } from '@kanaria/shared';

  interface PlayerTag {
    id: string;
    name: string;
  }

  interface Player {
    id: string;
    lastName: string;
    firstName: string;
    nickName?: string | null;
    imageUrl?: string | null;
    tags: PlayerTag[];
  }

  const { data } = $props();
  const playerId = page.params.id;

  let player = $state<Player | null>(null);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let error = $state<string | null>(null);
  let gradeTags = $state<Tag[]>([]);

  // Form state
  let lastName = $state('');
  let firstName = $state('');
  let nickName = $state('');
  let imageUrl = $state('');
  let selectedTagIds = $state<string[]>([]);

  $effect(() => {
    if (!data.session?.access_token) return;
    (async () => {
      try {
        const [playerData, tags] = await Promise.all([
          apiGet<Player>(`/players/${playerId}`, data.session.access_token),
          fetchGradeTags(window.fetch),
        ]);
        player = playerData;
        gradeTags = tags;

        // Populate form
        lastName = playerData.lastName;
        firstName = playerData.firstName;
        nickName = playerData.nickName || '';
        imageUrl = playerData.imageUrl || '';
        selectedTagIds = playerData.tags.map(t => t.id);
      } catch (e) {
        console.error(e);
        error = "選手情報の取得に失敗しました";
      } finally {
        isLoading = false;
      }
    })();
  });

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter(id => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!lastName.trim() || !firstName.trim()) {
      error = "姓と名は必須です";
      return;
    }

    isSaving = true;
    error = null;

    try {
      await apiPut(`/players/${playerId}`, {
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        nickName: nickName.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        tagIds: selectedTagIds,
      }, data.session?.access_token);

      goto(`/players/${playerId}`);
    } catch (e) {
      console.error(e);
      error = "保存に失敗しました";
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    goto(`/players/${playerId}`);
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/players/{playerId}" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      詳細に戻る
    </a>
  </div>

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error && !player}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else if player}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">選手を編集</h1>
      </div>
      
      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        {#if error}
          <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        {/if}

        <!-- Name Fields -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="lastName" class="block text-sm font-medium text-gray-700">
              姓 <span class="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              bind:value={lastName}
              required
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="山田"
            />
          </div>
          <div class="space-y-2">
            <label for="firstName" class="block text-sm font-medium text-gray-700">
              名 <span class="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              bind:value={firstName}
              required
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="太郎"
            />
          </div>
        </div>

        <!-- Nickname -->
        <div class="space-y-2">
          <label for="nickName" class="block text-sm font-medium text-gray-700">
            ニックネーム
          </label>
          <input
            id="nickName"
            type="text"
            bind:value={nickName}
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="たろう"
          />
        </div>

        <!-- Image URL -->
        <div class="space-y-2">
          <label for="imageUrl" class="block text-sm font-medium text-gray-700">
            画像URL
          </label>
          <input
            id="imageUrl"
            type="url"
            bind:value={imageUrl}
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <!-- Tags -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">
            タグ（複数選択可）
          </label>
          <div class="flex flex-wrap gap-2">
            {#each gradeTags as tag}
              <button
                type="button"
                onclick={() => toggleTag(tag.id)}
                class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all {selectedTagIds.includes(tag.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}"
              >
                {tag.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            class="flex-1 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onclick={handleCancel}
            class="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200 transition-all"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
