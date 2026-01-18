<script lang="ts">
import { apiPut } from "$lib/api/client";
import type { UserWithTags, CurrentUser, TagSimple } from "@kanaria/shared";

let { data } = $props();

let user = $state<UserWithTags | null>(data.user);
let currentUser = $state<CurrentUser | null>(data.currentUser);
let allTags = $state<TagSimple[]>(data.allTags || []);

// Edit states
let isEditingName = $state(false);
let editedName = $state(data.user?.name || "");
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

async function saveName() {
  if (!user || !canEdit) return;
  if (!editedName.trim()) {
    alert("名前は必須です");
    return;
  }

  isSavingName = true;
  try {
    const updated = await apiPut<UserWithTags>(
      `/users/${user.id}`,
      { name: editedName },
      data.session?.access_token
    );

    user = updated;
    isEditingName = false;
  } catch (e) {
    console.error("Failed to update name", e);
    alert("名前の更新に失敗しました");
  } finally {
    isSavingName = false;
  }
}

async function addTag(tag: TagSimple) {
  if (!user || !canEdit) return;

  const newTagIds = [...user.tags.map((t) => t.id), tag.id];
  await updateTags(newTagIds);
  tagSearch = "";
}

async function removeTag(tagId: string) {
  if (!user || !canEdit) return;

  const newTagIds = user.tags.filter((t) => t.id !== tagId).map((t) => t.id);
  await updateTags(newTagIds);
}

async function updateTags(tagIds: string[]) {
  if (!user) return;

  isSavingTags = true;
  try {
    const updatedTags = await apiPut<TagSimple[]>(
      `/users/${user.id}/tags`,
      { tagIds },
      data.session?.access_token
    );

    user = { ...user, tags: updatedTags };
  } catch (e) {
    console.error("Failed to update tags", e);
    alert("タグの更新に失敗しました");
  } finally {
    isSavingTags = false;
  }
}

// Sync with server data
$effect(() => {
  if (data.user) {
    user = data.user;
    editedName = data.user.name;
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

<div class="container mx-auto px-4 py-6 max-w-2xl">
  <!-- Back Button -->
  <div class="mb-6">
    <a
      href="/users"
      class="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-sm font-medium"
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

  <h1 class="text-2xl font-bold mb-6">ユーザー詳細</h1>

  {#if data.error}
    <div
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6"
    >
      {data.error}
    </div>
  {/if}

  {#if user}
    <div class="space-y-6">
      <!-- User Info Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <!-- Name -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">名前</div>
          {#if isEditingName && canEdit}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={editedName}
                disabled={isSavingName}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                onclick={saveName}
                disabled={isSavingName}
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSavingName ? "保存中..." : "保存"}
              </button>
              <button
                onclick={cancelEditName}
                disabled={isSavingName}
                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          {:else}
            <div class="flex items-center justify-between">
              <p class="text-gray-900">{user.name}</p>
              {#if canEdit}
                <button
                  onclick={startEditName}
                  class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  編集
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Email (read-only) -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </div>
          <p class="text-gray-900">{user.email}</p>
        </div>

        <!-- Role (read-only) -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">権限</div>
          <span
            class="inline-block px-3 py-1 text-sm font-medium rounded {user.roleId ===
            0
              ? 'bg-purple-100 text-purple-700'
              : user.roleId === 1
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'}"
          >
            {ROLES[user.roleId]}
          </span>
        </div>
      </div>

      <!-- Players Card -->
      {#if user.players && user.players.length > 0}
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold mb-4">保護者として登録されているプレイヤー</h2>
          <div class="flex flex-wrap gap-2">
            {#each user.players as player}
              <a
                href="/players/{player.id}"
                class="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium transition-colors"
              >
                {player.lastName} {player.firstName}
                {#if player.nickName}
                  <span class="text-indigo-500">({player.nickName})</span>
                {/if}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Tags Card -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">タグ</h2>
          {#if !canEdit}
            <span class="text-sm text-gray-500">閲覧のみ</span>
          {/if}
        </div>
        
        <!-- Add Tag (only for owner/admin) -->
        {#if canEdit}
          <div>
            <div class="block text-sm font-medium text-gray-700 mb-2">
              タグを追加
            </div>
            <div class="relative">
              <input
                type="text"
                bind:value={tagSearch}
                disabled={isSavingTags}
                placeholder="タグ名で検索..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
              {#if filteredTags.length > 0}
                <div
                  class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {#each filteredTags as tag}
                    <button
                      onclick={() => addTag(tag)}
                      disabled={isSavingTags}
                      class="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
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
          <div class="block text-sm font-medium text-gray-700 mb-2">
            設定済みタグ
          </div>
          {#if user.tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each user.tags as tag}
                <span
                  class="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                >
                  {tag.name}
                  {#if canEdit && !isSavingTags}
                    <button
                      onclick={() => removeTag(tag.id)}
                      class="hover:bg-indigo-100 rounded-full p-0.5"
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
            <p class="text-sm text-gray-500">タグが設定されていません</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
