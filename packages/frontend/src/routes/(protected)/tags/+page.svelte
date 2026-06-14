<script lang="ts">
import TagRow from "$lib/components/TagRow.svelte";
import { invalidateAll } from "$app/navigation";

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

let tags = $state<Tag[]>(data.tags || []);
let allLabels = $state<Label[]>(data.allLabels || []);
let searchQuery = $state("");
let isLoading = $state(false);

$effect(() => {
  if (data.tags) tags = data.tags;
  if (data.allLabels) allLabels = data.allLabels;
});

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



async function handleAddTag() {
  try {
    const res = await fetch("?/addTag", { method: "POST" });
    if (res.ok) await invalidateAll();
  } catch (e) {
    console.error("Failed to add tag", e);
  }
}

async function handleUpdateTag(id: string, updates: { name?: string; color?: string }) {
  try {
    const formData = new FormData();
    formData.append("id", id);
    if (updates.name) formData.append("name", updates.name);
    if (updates.color) formData.append("color", updates.color);
    
    const res = await fetch("?/updateTag", { method: "POST", body: formData });
    if (res.ok) await invalidateAll();
  } catch (e) {
    console.error("Failed to update tag", e);
  }
}

async function handleDeleteTag(id: string) {
  if (!confirm("このタグを削除しますか？")) return;
  try {
    const formData = new FormData();
    formData.append("id", id);
    const res = await fetch("?/deleteTag", { method: "POST", body: formData });
    if (res.ok) await invalidateAll();
  } catch (e) {
    console.error("Failed to delete tag", e);
  }
}

async function handleAddLabel(tagId: string, labelId: string) {
  try {
    const formData = new FormData();
    formData.append("tagId", tagId);
    formData.append("labelId", labelId);
    const res = await fetch("?/addLabel", { method: "POST", body: formData });
    if (res.ok) await invalidateAll();
  } catch (e) {
    console.error("Failed to add label", e);
  }
}

async function handleRemoveLabel(tagId: string, labelId: string) {
  try {
    const formData = new FormData();
    formData.append("tagId", tagId);
    formData.append("labelId", labelId);
    const res = await fetch("?/removeLabel", { method: "POST", body: formData });
    if (res.ok) await invalidateAll();
  } catch (e) {
    console.error("Failed to remove label", e);
  }
}


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
