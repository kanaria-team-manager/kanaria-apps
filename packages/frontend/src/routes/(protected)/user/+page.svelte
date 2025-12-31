<script lang="ts">
  import { apiGet, apiPut } from '$lib/api/client';
  import { fetchTags } from '$lib/api/master';
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

  const { data } = $props();

  let user = $state<UserProfile | null>(null);
  let allTags = $state<Tag[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  // Edit states
  let isEditingName = $state(false);
  let editedName = $state('');
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

  $effect(() => {
    if (!data.session?.access_token) return;
    (async () => {
      try {
        const [userData, tagsData] = await Promise.all([
          apiGet<UserProfile>('/users/me', data.session.access_token),
          fetchTags(window.fetch),
        ]);
        user = userData;
        allTags = tagsData;
        editedName = userData.name;
      } catch (e) {
        console.error(e);
        error = 'ユーザー情報の取得に失敗しました';
      } finally {
        isLoading = false;
      }
    })();
  });

  function startEditName() {
    editedName = user?.name || '';
    isEditingName = true;
  }

  function cancelEditName() {
    isEditingName = false;
    editedName = user?.name || '';
  }

  async function saveName() {
    if (!data.session?.access_token || !editedName.trim()) return;
    isSavingName = true;
    try {
      await apiPut('/users/me', { name: editedName }, data.session.access_token);
      if (user) {
        user = { ...user, name: editedName };
      }
      isEditingName = false;
    } catch (e) {
      console.error(e);
      alert('名前の保存に失敗しました');
    } finally {
      isSavingName = false;
    }
  }

  async function addTag(tag: Tag) {
    if (!data.session?.access_token || !user) return;
    isSavingTags = true;
    const newTagIds = [...user.tags.map(t => t.id), tag.id];
    try {
      const updatedTags = await apiPut<UserTag[]>('/users/me/tags', { tagIds: newTagIds }, data.session.access_token);
      user = { ...user, tags: updatedTags };
      tagSearch = '';
    } catch (e) {
      console.error(e);
      alert('タグの追加に失敗しました');
    } finally {
      isSavingTags = false;
    }
  }

  async function removeTag(tagId: string) {
    if (!data.session?.access_token || !user) return;
    isSavingTags = true;
    const newTagIds = user.tags.filter(t => t.id !== tagId).map(t => t.id);
    try {
      const updatedTags = await apiPut<UserTag[]>('/users/me/tags', { tagIds: newTagIds }, data.session.access_token);
      user = { ...user, tags: updatedTags };
    } catch (e) {
      console.error(e);
      alert('タグの削除に失敗しました');
    } finally {
      isSavingTags = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-6 max-w-2xl">
  <div class="mb-6">
    <a href="/dashboard" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      ダッシュボードに戻る
    </a>
  </div>

  <h1 class="text-2xl font-bold mb-6">ユーザー設定</h1>

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      {error}
    </div>
  {:else if user}
    <div class="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      
      <!-- Name -->
      <div class="space-y-2">
        <span class="text-sm font-medium text-muted-foreground">名前</span>
        {#if isEditingName}
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={editedName}
              class="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="名前を入力"
            />
            <button
              onclick={saveName}
              disabled={isSavingName || !editedName.trim()}
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSavingName ? '保存中...' : '保存'}
            </button>
            <button
              onclick={cancelEditName}
              disabled={isSavingName}
              class="px-4 py-2 border border-input rounded-md hover:bg-accent"
            >
              キャンセル
            </button>
          </div>
        {:else}
          <div class="flex items-center justify-between">
            <span class="text-lg">{user.name}</span>
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
          <span class="text-muted-foreground">{user.email}</span>
        </div>
      </div>

      <!-- Tags -->
      <div class="space-y-3">
        <span class="text-sm font-medium text-muted-foreground">タグ</span>
        
        <!-- Current tags -->
        <div class="flex flex-wrap gap-2 min-h-[2rem]">
          {#each user.tags as tag}
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {tag.name}
              <button
                onclick={() => removeTag(tag.id)}
                disabled={isSavingTags}
                class="hover:bg-primary/20 rounded-full p-0.5 disabled:opacity-50"
                aria-label="タグを削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          {/each}
          {#if user.tags.length === 0}
            <span class="text-sm text-muted-foreground">タグがありません</span>
          {/if}
        </div>

        <!-- Tag search -->
        <div class="relative">
          <input
            type="text"
            bind:value={tagSearch}
            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="タグを検索して追加..."
          />
          
          {#if filteredTags.length > 0}
            <div class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
              {#each filteredTags as tag}
                <button
                  onclick={() => addTag(tag)}
                  disabled={isSavingTags}
                  class="w-full px-3 py-2 text-left hover:bg-accent disabled:opacity-50 flex items-center gap-2"
                >
                  <span class="text-primary">+</span>
                  {tag.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    </div>
  {/if}
</div>
