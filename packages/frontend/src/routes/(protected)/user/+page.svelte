<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Tag } from '$lib/api/types';

  interface UserTag {
    id: string;
    name: string;
  }

  interface UserProfile {
    id: string;
    name: string;
    email: string;
    roleId: number;
    tags: UserTag[];
  }

  const { data, form } = $props();

  // Use data from load function
  let user = $state<UserProfile | null>(data.profile);
  let allTags = $state<Tag[]>(data.allTags || []);
  
  // Edit states
  let isEditingName = $state(false);
  let editedName = $state(data.profile?.name || '');
  let isSavingName = $state(false);
  let isSavingTags = $state(false);
  
  // Tag search
  let tagSearch = $state('');

  const filteredTags = $derived.by(() => {
    if (!tagSearch.trim()) return [];
    const search = tagSearch.toLowerCase();
    const userTagIds = new Set(user?.tags.map(t => t.id) || []);
    return allTags
      .filter(tag => 
        tag.name.toLowerCase().includes(search) && 
        !userTagIds.has(tag.id)
      )
      .slice(0, 5);
  });

  function startEditName() {
    editedName = user?.name || '';
    isEditingName = true;
  }

  function cancelEditName() {
    isEditingName = false;
    editedName = user?.name || '';
  }

  // Handle form action results
  $effect(() => {
    if (form?.nameSuccess && user) {
      user = { ...user, name: editedName };
      isEditingName = false;
    }
    if (form?.tagSuccess) {
      // Tag update was successful, data is reloaded by invalidation
    }
  });

  function getNewTagIds(tagToAdd: Tag): string[] {
    return [...(user?.tags.map(t => t.id) || []), tagToAdd.id];
  }

  function getTagIdsAfterRemove(tagIdToRemove: string): string[] {
    return (user?.tags || []).filter(t => t.id !== tagIdToRemove).map(t => t.id);
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">ユーザープロファイル</h1>
        <p class="text-muted-foreground mt-1">あなたの基本情報と所属タグの確認・編集を行います</p>
      </div>
    </div>
  </div>

  {#if data.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {data.error}
    </div>
  {:else if user}
    <div class="bg-card border border-border rounded-lg p-6 space-y-6">
      
      <!-- Name -->
      <div class="space-y-2">
        <span class="text-sm font-medium text-muted-foreground">名前</span>
        {#if isEditingName}
          <form 
            method="POST" 
            action="?/updateName"
            class="flex gap-2"
            use:enhance={() => {
              isSavingName = true;
              return async ({ update }) => {
                await update();
                isSavingName = false;
              };
            }}
          >
            <input
              type="text"
              name="name"
              bind:value={editedName}
              class="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="名前を入力"
            />
            <button
              type="submit"
              disabled={isSavingName || !editedName.trim()}
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSavingName ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onclick={cancelEditName}
              disabled={isSavingName}
              class="px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
            >
              キャンセル
            </button>
          </form>
          {#if form?.nameError}
            <p class="text-sm text-destructive mt-1">{form.nameError}</p>
          {/if}
        {:else}
          <div class="flex items-center justify-between">
            <span class="text-lg text-foreground font-medium">{user.name}</span>
            <button
              onclick={startEditName}
              class="text-sm text-primary hover:underline"
            >
              編集
            </button>
          </div>
        {/if}
      </div>

      <!-- Email (read-only) -->
      <div class="space-y-2">
        <span class="text-sm font-medium text-muted-foreground">メールアドレス</span>
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span class="text-foreground">{user.email}</span>
        </div>
      </div>

      <!-- Tags -->
      <div class="space-y-3">
        <span class="text-sm font-medium text-muted-foreground">タグ</span>

        <!-- Tag search -->
        <div class="relative">
          <input
            type="text"
            bind:value={tagSearch}
            class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="タグを検索して追加..."
          />
          
          {#if filteredTags.length > 0}
            <div class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
              {#each filteredTags as tag}
                <form 
                  method="POST" 
                  action="?/addTag" 
                  class="contents"
                  use:enhance={() => {
                    isSavingTags = true;
                    tagSearch = '';
                    // Optimistically update UI
                    if (user) {
                      user = { ...user, tags: [...user.tags, { id: tag.id, name: tag.name }] };
                    }
                    return async ({ update }) => {
                      await update({ invalidateAll: true });
                      isSavingTags = false;
                    };
                  }}
                >
                  <input type="hidden" name="tagIds" value={JSON.stringify(getNewTagIds(tag))} />
                  <button
                    type="submit"
                    disabled={isSavingTags}
                    class="w-full px-3 py-2 text-left hover:bg-muted disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <span class="text-primary font-bold">+</span>
                    {tag.name}
                  </button>
                </form>
              {/each}
            </div>
          {/if}
        </div>

        {#if form?.tagError}
          <p class="text-sm text-destructive mt-1">{form.tagError}</p>
        {/if}

        <!-- Current tags -->
        <div class="flex flex-wrap gap-2 min-h-[2.5rem]">
          {#each user.tags as tag (tag.id)}
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {tag.name}
              <form 
                method="POST" 
                action="?/removeTag" 
                class="contents"
                use:enhance={() => {
                  isSavingTags = true;
                  // Optimistically update UI
                  if (user) {
                    user = { ...user, tags: user.tags.filter(t => t.id !== tag.id) };
                  }
                  return async ({ update }) => {
                    await update({ invalidateAll: true });
                    isSavingTags = false;
                  };
                }}
              >
                <input type="hidden" name="tagIds" value={JSON.stringify(getTagIdsAfterRemove(tag.id))} />
                <button
                  type="submit"
                  disabled={isSavingTags}
                  class="hover:bg-primary/20 rounded-full p-0.5 disabled:opacity-50 transition-colors"
                  aria-label="タグを削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </span>
          {/each}
          {#if user.tags.length === 0}
            <span class="text-sm text-muted-foreground flex items-center h-8">タグがありません</span>
          {/if}
        </div>
      </div>

    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      ユーザー情報が見つかりませんでした
    </div>
  {/if}
</div>
