<script lang="ts">
import { apiGet, apiPost, apiPut, apiDelete } from "$lib/api/client";
import { fetchLabels } from "$lib/api/master";
import TagRow from "$lib/components/TagRow.svelte";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  teamId: string | null;
  systemFlag: boolean;
  label?: Label | null;
}

let { data } = $props();

let tags = $state<Tag[]>([]);
let allLabels = $state<Label[]>([]);
let searchQuery = $state("");
let isLoading = $state(true);

// Preset colors for picker
const PRESET_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

const filteredTags = $derived(
  tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ),
);

async function fetchTags() {
  if (!data.session?.access_token) return;
  isLoading = true;
  try {
    const res = await apiGet<Tag[]>("/tags", data.session.access_token);
    tags = res;
  } catch (e) {
    console.error("Failed to fetch tags", e);
  } finally {
    isLoading = false;
  }
}

async function fetchAllLabels() {
  if (!data.session?.access_token) return;
  try {
    const res = await fetchLabels(fetch, data.session.access_token);
    allLabels = res;
  } catch (e) {
    console.error("Failed to fetch labels", e);
  }
}

async function handleAddTag() {
  if (!data.session?.access_token) return;
  try {
    const newTag = await apiPost<Tag>(
      "/tags",
      {
        name: "新規タグ",
        color: "#6366f1",
      },
      data.session.access_token,
    );
    tags = [newTag, ...tags];
  } catch (e) {
    console.error("Failed to add tag", e);
  }
}

async function handleUpdateTag(
  id: string,
  updates: { name?: string; color?: string },
) {
  if (!data.session?.access_token) return;
  try {
    await apiPut(`/tags/${id}`, updates, data.session.access_token);
    tags = tags.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag));
  } catch (e) {
    console.error("Failed to update tag", e);
  }
}

async function handleDeleteTag(id: string) {
  if (!data.session?.access_token) return;
  if (!confirm("このタグを削除しますか？")) return;
  try {
    await apiDelete(`/tags/${id}`, data.session.access_token);
    tags = tags.filter((tag) => tag.id !== id);
  } catch (e) {
    console.error("Failed to delete tag", e);
  }
}

async function handleAddLabel(tagId: string, labelId: string) {
  if (!data.session?.access_token) return;
  try {
    await apiPost(
      `/tags/${tagId}/labels/${labelId}`,
      {},
      data.session.access_token,
    );
    // ローカルステートを更新 - 単一ラベルに設定
    const label = allLabels.find((l) => l.id === labelId);
    if (label) {
      tags = tags.map((tag) => (tag.id === tagId ? { ...tag, label } : tag));
    }
  } catch (e) {
    console.error("Failed to add label", e);
  }
}

async function handleRemoveLabel(tagId: string, labelId: string) {
  if (!data.session?.access_token) return;
  try {
    await apiDelete(
      `/tags/${tagId}/labels/${labelId}`,
      data.session.access_token,
    );
    // ローカルステートを更新 - ラベルをnullに設定
    tags = tags.map((tag) =>
      tag.id === tagId ? { ...tag, label: null } : tag,
    );
  } catch (e) {
    console.error("Failed to remove label", e);
  }
}

$effect(() => {
  if (data.session) {
    fetchTags();
    fetchAllLabels();
  }
});
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">タグ管理</h1>
        <p class="text-muted-foreground mt-1">オブジェクトに適用できるタグの管理と設定を行います</p>
      </div>
      <button
        onclick={handleAddTag}
        class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        タグを追加
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="タグを検索..."
        bind:value={searchQuery}
        class="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="rounded-lg border border-border bg-card">
    <!-- Table Header -->
    <div class="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
      <div class="col-span-3">タグ名</div>
      <div class="col-span-2">カラー</div>
      <div class="col-span-5">ラベル</div>
      <div class="col-span-2"></div>
    </div>

    <!-- Table Body -->
    <div class="divide-y divide-border">
      {#if isLoading}
        <div class="px-6 py-12 text-center text-muted-foreground">読み込み中...</div>
      {:else if filteredTags.length === 0}
        <div class="px-6 py-12 text-center text-muted-foreground">
          {searchQuery ? "タグが見つかりませんでした" : "タグがありません"}
        </div>
      {:else}
        {#each filteredTags as tag (tag.id)}
          <TagRow
            {tag}
            {allLabels}
            presetColors={PRESET_COLORS}
            onUpdate={handleUpdateTag}
            onDelete={handleDeleteTag}
            onAddLabel={handleAddLabel}
            onRemoveLabel={handleRemoveLabel}
          />
        {/each}
      {/if}
    </div>
  </div>

  <!-- Stats -->
  <div class="mt-6 flex items-center justify-between text-sm text-muted-foreground">
    <div>
      全{tags.length}件のタグ
      {#if searchQuery}
        • {filteredTags.length}件表示中
      {/if}
    </div>
  </div>
</div>
