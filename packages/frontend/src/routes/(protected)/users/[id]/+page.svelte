<script lang="ts">
import { enhance } from "$app/forms";
import type { UserWithTags, CurrentUser, TagSimple } from "@kanaria/shared";

let { data } = $props();

let user = $state<UserWithTags | null>(data.targetUser);
let currentUser = $state<CurrentUser | null>(data.currentUser);
let allTags = $state<TagSimple[]>(data.allTags || []);

// Edit states
let isEditingName = $state(false);
let editedName = $state(data.targetUser?.name || "");
let isSavingName = $state(false);
let isSavingTags = $state(false);

// Tag search
let tagSearch = $state("");

const ROLES: Record<number, string> = {
  0: "Owner",
  1: "Admin",
  2: "User",
};

// Can edit if current user is owner or admin
const canEdit = $derived(
  currentUser && (currentUser.roleId === 0 || currentUser.roleId === 1)
);

const filteredTags = $derived.by(() => {
  if (!tagSearch.trim()) return [];
  const search = tagSearch.toLowerCase();
  const userTagIds = new Set(user?.tags.map((t) => t.id) || []);
  return allTags
    .filter(
      (tag) => tag.name.toLowerCase().includes(search) && !userTagIds.has(tag.id)
    )
    .slice(0, 5);
});

function startEditName() {
  if (!canEdit || !user) return;
  editedName = user.name;
  isEditingName = true;
}

function cancelEditName() {
  isEditingName = false;
  editedName = user?.name || "";
}

// Actually, let's use a hidden form for tags to use SvelteKit's enhance properly.
let tagsForm: HTMLFormElement | undefined = $state();
let newTagIds = $state<string[]>([]);

function addTag(tag: TagSimple) {
  if (!user || !canEdit) return;
  newTagIds = [...user.tags.map((t) => t.id), tag.id];
  tagsForm?.requestSubmit();
  tagSearch = "";
}

function removeTag(tagId: string) {
  if (!user || !canEdit) return;
  newTagIds = user.tags.filter((t) => t.id !== tagId).map((t) => t.id);
  tagsForm?.requestSubmit();
}

// Sync with server data
$effect(() => {
  if (data.targetUser) {
    user = data.targetUser;
    editedName = data.targetUser.name;
  } else {
    user = null;
    editedName = "";
  }
  if (data.currentUser) {
    currentUser = data.currentUser;
  }
  if (data.allTags) {
    allTags = data.allTags;
  }
});
</script>

<svelte:head>
  <title>ユーザー詳細 | Kanaria</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Back Button -->
  <div class="mb-6">
    <a
      href="/users"
      class="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      ユーザー一覧に戻る
    </a>
  </div>

  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">ユーザー詳細</h1>
        <p class="text-muted-foreground mt-1">ユーザーの基本情報と取得したタグの管理を行います</p>
      </div>
    </div>
  </div>

  {#if data.error}
    <div
      class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6"
    >
      {data.error}
    </div>
  {/if}

  {#if user}
    <div class="space-y-6">
      <!-- User Info Card -->
      <div class="bg-card rounded-lg border border-border p-6 space-y-4">
        <!-- Name -->
        <div>
          <div class="block text-sm font-medium text-muted-foreground mb-2">名前</div>
          {#if isEditingName && canEdit}
            <form
              method="POST"
              action="?/updateName"
              use:enhance={() => {
                isSavingName = true;
                return async ({ result, update }) => {
                  isSavingName = false;
                  if (result.type === 'success') {
                    isEditingName = false;
                    await update();
                  } else if (result.type === 'failure') {
                    alert(result.data?.error || "名前の更新に失敗しました");
                  }
                };
              }}
              class="flex gap-2"
            >
              <input
                type="text"
                name="name"
                bind:value={editedName}
                disabled={isSavingName}
                class="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSavingName}
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingName ? "保存中..." : "保存"}
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
          {:else}
            <div class="flex items-center justify-between">
              <p class="text-foreground text-lg">{user.name}</p>
              {#if canEdit}
                <button
                  onclick={startEditName}
                  class="text-sm text-primary hover:underline font-medium"
                >
                  編集
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Email (read-only) -->
        <div>
          <div class="block text-sm font-medium text-muted-foreground mb-2">
            メールアドレス
          </div>
          <p class="text-foreground">{user.email}</p>
        </div>

        <!-- Role (read-only) -->
        <div>
          <div class="block text-sm font-medium text-muted-foreground mb-2">権限</div>
          <span
            class="inline-block px-3 py-1 text-sm font-medium rounded {user.roleId ===
            0
              ? 'bg-purple-100 text-purple-700'
              : user.roleId === 1
                ? 'bg-blue-100 text-blue-700'
                : 'bg-muted text-muted-foreground'}"
          >
            {ROLES[user.roleId]}
          </span>
        </div>
      </div>

      <!-- Players Card -->
      {#if user.players && user.players.length > 0}
        <div class="bg-card rounded-lg border border-border p-6">
          <h2 class="text-lg font-semibold mb-4 text-foreground">保護者として登録されているプレイヤー</h2>
          <div class="flex flex-wrap gap-2">
            {#each user.players as player}
              <a
                href="/players/{player.id}"
                class="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
              >
                {player.lastName} {player.firstName}
                {#if player.nickName}
                  <span class="opacity-70">({player.nickName})</span>
                {/if}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Tags Card -->
      <div class="bg-card rounded-lg border border-border p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">タグ</h2>
          {#if !canEdit}
            <span class="text-sm text-muted-foreground">閲覧のみ</span>
          {/if}
        </div>
        
        <!-- Add Tag (only for owner/admin) -->
        {#if canEdit}
          <div>
            <form 
              bind:this={tagsForm}
              method="POST" 
              action="?/updateTags"
              use:enhance={() => {
                isSavingTags = true;
                return async ({ result, update }) => {
                  isSavingTags = false;
                  if (result.type === 'success') {
                    await update();
                  } else {
                    alert("タグの更新に失敗しました");
                  }
                };
              }}
              class="hidden"
            >
               <input type="hidden" name="tagIds" value={JSON.stringify(newTagIds)} />
            </form>
            <div class="block text-sm font-medium text-muted-foreground mb-2">
              タグを追加
            </div>
            <div class="relative">
              <input
                type="text"
                bind:value={tagSearch}
                disabled={isSavingTags}
                placeholder="タグ名で検索..."
                class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              {#if filteredTags.length > 0}
                <div
                  class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {#each filteredTags as tag}
                    <button
                      onclick={() => addTag(tag)}
                      disabled={isSavingTags}
                      class="w-full text-left px-4 py-2 hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      {tag.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Current Tags -->
        <div>
          <div class="block text-sm font-medium text-muted-foreground mb-2">
            設定済みタグ
          </div>
          {#if user.tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each user.tags as tag}
                <span
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {tag.name}
                  {#if canEdit && !isSavingTags}
                    <button
                      onclick={() => removeTag(tag.id)}
                      class="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="タグを削除"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  {/if}
                </span>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">タグが設定されていません</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

