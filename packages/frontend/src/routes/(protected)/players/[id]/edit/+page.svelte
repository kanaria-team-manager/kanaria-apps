<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
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

  const { data, form } = $props();
  const playerId = page.params.id;

  // Use data from load function
  const player = data.player as Player | null;
  const gradeTags = (data.gradeTags || []) as Tag[];

  let isSubmitting = $state(false);

  // Form state (initialized from load data, updated from form on error)
  let lastName = $state(form?.lastName ?? player?.lastName ?? '');
  let firstName = $state(form?.firstName ?? player?.firstName ?? '');
  let nickName = $state(form?.nickName ?? player?.nickName ?? '');
  let imageUrl = $state(form?.imageUrl ?? player?.imageUrl ?? '');
  let selectedTagIds = $state<string[]>(player?.tags.map(t => t.id) || []);

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter(id => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
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

  {#if (form?.error || data.error) && !player}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {form?.error || data.error}
    </div>
  {:else if player}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">選手を編集</h1>
      </div>
      
      <form 
        method="POST" 
        class="p-6 space-y-6"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}
      >
        {#if form?.error}
          <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {form.error}
          </div>
        {/if}

        <!-- Hidden input for tag IDs -->
        <input type="hidden" name="tagIds" value={JSON.stringify(selectedTagIds)} />

        <!-- Name Fields -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="lastName" class="block text-sm font-medium text-gray-700">
              姓 <span class="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
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
              name="firstName"
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
            name="nickName"
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
            name="imageUrl"
            type="url"
            bind:value={imageUrl}
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <!-- Tags -->
        <div class="space-y-3">
          <span class="block text-sm font-medium text-gray-700">
            タグ（複数選択可）
          </span>
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
            disabled={isSubmitting}
            class="flex-1 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
          <a
            href="/players/{playerId}"
            class="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-center"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      選手情報が見つかりませんでした
    </div>
  {/if}
</div>
