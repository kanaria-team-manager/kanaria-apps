<script lang="ts">
import { apiGet, apiPut } from "$lib/api/client";
import { fetchTags } from "$lib/api/master";

interface Tag {
  id: string;
  name: string;
}

interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  tags: Tag[];
}

interface User {
  id: string;
  name: string;
  email: string;
  roleId: number;
  tags: Tag[];
  players: Player[];
}

let { data } = $props();

let users = $state<User[]>([]);
let allTags = $state<Tag[]>([]);
let currentUser = $state<User | null>(null);
let isLoading = $state(true);

// Filter state
let selectedTags = $state<string[]>([]);
let searchQuery = $state("");

// UI state
let expandedUsers = $state<Set<string>>(new Set());
let editingUserId = $state<string | null>(null);
let editName = $state("");
let editRoleId = $state(0);
let editTagIds = $state<string[]>([]);

const ROLES: Record<number, string> = {
  0: "Owner",
  1: "Admin",
  2: "User",
};

// Can edit if current user is owner or admin
const canEdit = $derived(
  currentUser && (currentUser.roleId === 0 || currentUser.roleId === 1)
);

// Filtered users
const filteredUsers = $derived(
  users.filter((user) => {
    // Tag filter: match user tags OR any player tags
    const tagMatch =
      selectedTags.length === 0 ||
      user.tags.some((t) => selectedTags.includes(t.id)) ||
      user.players.some((p) => p.tags.some((t) => selectedTags.includes(t.id)));

    // Freeword filter: name, email, or player names
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.players.some((p) =>
        `${p.lastName} ${p.firstName} ${p.nickName || ""}`
          .toLowerCase()
          .includes(searchLower)
      );

    return tagMatch && searchMatch;
  })
);

async function fetchUsers() {
  if (!data.session?.access_token) return;
  isLoading = true;
  try {
    const [usersData, tagsData, currentUserData] = await Promise.all([
      apiGet<User[]>("/users", data.session.access_token),
      fetchTags(fetch, data.session.access_token),
      apiGet<User>("/users/me", data.session.access_token),
    ]);
    users = usersData;
    allTags = tagsData;
    currentUser = currentUserData;
  } catch (e) {
    console.error("Failed to fetch users", e);
  } finally {
    isLoading = false;
  }
}

function toggleUser(userId: string) {
  if (expandedUsers.has(userId)) {
    expandedUsers.delete(userId);
  } else {
    expandedUsers.add(userId);
  }
  expandedUsers = new Set(expandedUsers);
}

function startEdit(user: User) {
  if (!canEdit) return;
  editingUserId = user.id;
  editName = user.name;
  editRoleId = user.roleId;
  editTagIds = user.tags.map((t) => t.id);
}

function cancelEdit() {
  editingUserId = null;
  editName = "";
  editRoleId = 0;
  editTagIds = [];
}

async function saveEdit(userId: string) {
  if (!data.session?.access_token) return;
  if (!editName.trim()) {
    alert("名前は必須です");
    return;
  }

  try {
    // Update user profile (name and roleId would need separate endpoint)
    // For now, focusing on tags as per requirements
    await apiPut(
      `/users/${userId}/tags`,
      { tagIds: editTagIds },
      data.session.access_token
    );

    // Update local state
    users = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            name: editName,
            roleId: editRoleId,
            tags: allTags.filter((t) => editTagIds.includes(t.id)),
          }
        : u
    );
    cancelEdit();
  } catch (e) {
    console.error("Failed to update user", e);
    alert("更新に失敗しました");
  }
}

function toggleTag(tagId: string) {
  if (editTagIds.includes(tagId)) {
    editTagIds = editTagIds.filter((id) => id !== tagId);
  } else {
    editTagIds = [...editTagIds, tagId];
  }
}

function toggleFilterTag(tagId: string) {
  if (selectedTags.includes(tagId)) {
    selectedTags = selectedTags.filter((id) => id !== tagId);
  } else {
    selectedTags = [...selectedTags, tagId];
  }
}

function getPlayerName(player: Player): string {
  if (player.nickName) return player.nickName;
  return `${player.lastName} ${player.firstName}`;
}

$effect(() => {
  if (data.session) {
    fetchUsers();
  }
});
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-semibold tracking-tight mb-4">ユーザー管理</h1>

    <!-- Filters -->
    <div class="space-y-4">
      <!-- Search -->
      <div class="relative max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="ユーザー名、メール、プレイヤー名で検索..."
          bind:value={searchQuery}
          class="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <!-- Tag Filters -->
      <div class="flex flex-wrap gap-2">
        {#each allTags as tag}
          <button
            type="button"
            onclick={() => toggleFilterTag(tag.id)}
            class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all {selectedTags.includes(
              tag.id
            )
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}"
          >
            {tag.name}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- User List -->
  {#if isLoading}
    <div class="text-center py-12">読み込み中...</div>
  {:else if filteredUsers.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      ユーザーが見つかりませんでした
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredUsers as user (user.id)}
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <!-- User Row -->
          <div class="p-4 flex items-center gap-4">
            <!-- Expand Button -->
            <button
              onclick={() => toggleUser(user.id)}
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="展開/折りたたみ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 transition-transform {expandedUsers.has(user.id)
                  ? 'rotate-90'
                  : ''}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {#if editingUserId === user.id}
              <!-- Editing Mode -->
              <div class="flex-1 grid grid-cols-12 gap-4 items-center">
                <!-- Name -->
                <div class="col-span-3">
                  <input
                    type="text"
                    bind:value={editName}
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <!-- Role -->
                <div class="col-span-2">
                  <select
                    bind:value={editRoleId}
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    {#each Object.entries(ROLES) as [value, label]}
                      <option value={Number(value)}>{label}</option>
                    {/each}
                  </select>
                </div>

                <!-- Tags -->
                <div class="col-span-5">
                  <div class="flex flex-wrap gap-1">
                    {#each allTags as tag}
                      <button
                        type="button"
                        onclick={() => toggleTag(tag.id)}
                        class="px-2 py-1 text-xs rounded {editTagIds.includes(
                          tag.id
                        )
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'}"
                      >
                        {tag.name}
                      </button>
                    {/each}
                  </div>
                </div>

                <!-- Actions -->
                <div class="col-span-2 flex gap-2 justify-end">
                  <button
                    onclick={() => saveEdit(user.id)}
                    class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    保存
                  </button>
                  <button
                    onclick={cancelEdit}
                    class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            {:else}
              <!-- Display Mode -->
              <div class="flex-1 grid grid-cols-12 gap-4 items-center">
                <!-- Name & Email -->
                <div class="col-span-3">
                  <div class="font-medium text-gray-900">{user.name}</div>
                  <div class="text-sm text-gray-500">{user.email}</div>
                </div>

                <!-- Role -->
                <div class="col-span-2">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded {user.roleId ===
                    0
                      ? 'bg-purple-100 text-purple-700'
                      : user.roleId === 1
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'}"
                  >
                    {ROLES[user.roleId]}
                  </span>
                </div>

                <!-- Tags -->
                <div class="col-span-5">
                  <div class="flex flex-wrap gap-1">
                    {#each user.tags as tag}
                      <span
                        class="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded"
                      >
                        {tag.name}
                      </span>
                    {/each}
                  </div>
                </div>

                <!-- Edit Button -->
                <div class="col-span-2 flex justify-end">
                  {#if canEdit}
                    <button
                      onclick={() => startEdit(user)}
                      class="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      編集
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Players (Expanded) -->
          {#if expandedUsers.has(user.id) && user.players.length > 0}
            <div class="bg-gray-50 border-t border-gray-200 px-4 py-3">
              <div class="ml-9 space-y-2">
                {#each user.players as player}
                  <div class="flex items-center gap-3 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span class="font-medium text-gray-700"
                      >{getPlayerName(player)}</span
                    >
                    <div class="flex gap-1">
                      {#each player.tags as tag}
                        <span
                          class="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded"
                        >
                          {tag.name}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Stats -->
  <div
    class="mt-6 text-sm text-muted-foreground flex items-center justify-between"
  >
    <div>
      全{users.length}件のユーザー
      {#if searchQuery || selectedTags.length > 0}
        • {filteredUsers.length}件表示中
      {/if}
    </div>
  </div>
</div>
