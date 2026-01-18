<script lang="ts">
import { apiGet, apiPost, apiPut, apiDelete } from "$lib/api/client";

interface Label {
  id: string;
  name: string;
  color: string;
  teamId: string | null;
  systemFlag: boolean;
  type?: string | null;
}

let { data } = $props();

let labels = $state<Label[]>([]);
let searchQuery = $state("");
let isLoading = $state(true);

// Editing state for inline editing
let editingId = $state<string | null>(null);
let editingName = $state("");
let editingColor = $state("");

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

const filteredLabels = $derived(
  labels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ),
);

async function fetchLabels() {
  if (!data.session?.access_token) return;
  isLoading = true;
  try {
    const res = await apiGet<Label[]>("/labels", data.session.access_token);
    labels = res;
  } catch (e) {
    console.error("Failed to fetch labels", e);
  } finally {
    isLoading = false;
  }
}

async function handleAddLabel() {
  if (!data.session?.access_token) return;
  try {
    const newLabel = await apiPost<Label>(
      "/labels",
      {
        name: "新規ラベル",
        color: "#6366f1",
      },
      data.session.access_token,
    );
    labels = [newLabel, ...labels];
    // Start editing the new label immediately
    startEdit(newLabel.id, newLabel.name, newLabel.color);
  } catch (e) {
    console.error("Failed to add label", e);
  }
}

function startEdit(id: string, name: string, color: string) {
  editingId = id;
  editingName = name;
  editingColor = color;
}

function cancelEdit() {
  editingId = null;
  editingName = "";
  editingColor = "";
}

async function saveEdit(id: string) {
  if (!data.session?.access_token) return;
  if (!editingName.trim()) {
    alert("ラベル名は必須です");
    return;
  }

  try {
    await apiPut(`/labels/${id}`, {
      name: editingName.trim(),
      color: editingColor,
    }, data.session.access_token);
    labels = labels.map((label) =>
      label.id === id
        ? { ...label, name: editingName.trim(), color: editingColor }
        : label,
    );
    cancelEdit();
  } catch (e) {
    console.error("Failed to update label", e);
  }
}

async function handleDeleteLabel(id: string, systemFlag: boolean) {
  if (systemFlag) {
    alert("システムラベルは削除できません");
    return;
  }
  if (!data.session?.access_token) return;
  if (!confirm("このラベルを削除しますか？")) return;
  try {
    await apiDelete(`/labels/${id}`, data.session.access_token);
    labels = labels.filter((label) => label.id !== id);
  } catch (e) {
    console.error("Failed to delete label", e);
  }
}

$effect(() => {
  if (data.session) {
    fetchLabels();
  }
});
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">ラベル管理</h1>
        <p class="text-muted-foreground mt-1">タグに適用できるラベルの管理と設定を行います</p>
      </div>
      <button
        onclick={handleAddLabel}
        class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        ラベルを追加
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="ラベルを検索..."
        bind:value={searchQuery}
        class="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="rounded-lg border border-border bg-card">
    <!-- Table Header -->
    <div class="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
      <div class="col-span-5">ラベル名</div>
      <div class="col-span-3">カラー</div>
      <div class="col-span-2">タイプ</div>
      <div class="col-span-2"></div>
    </div>

    <!-- Table Body -->
    <div class="divide-y divide-border">
      {#if isLoading}
        <div class="px-6 py-12 text-center text-muted-foreground">読み込み中...</div>
      {:else if filteredLabels.length === 0}
        <div class="px-6 py-12 text-center text-muted-foreground">
          {searchQuery ? "ラベルが見つかりませんでした" : "ラベルがありません"}
        </div>
      {:else}
        {#each filteredLabels as label (label.id)}
          <div class="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors">
            <!-- Label Name -->
            <div class="col-span-5">
              {#if editingId === label.id}
                <input
                  type="text"
                  bind:value={editingName}
                  class="w-full px-3 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ラベル名"
                />
              {:else}
                <div class="flex items-center gap-2">
                  <span class="font-medium">{label.name}</span>
                  {#if label.systemFlag}
                    <span class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">システム</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Color -->
            <div class="col-span-3">
              {#if editingId === label.id}
                <div class="flex flex-wrap gap-1.5">
                  {#each PRESET_COLORS as color}
                    <button
                      type="button"
                      onclick={() => editingColor = color}
                      class="w-6 h-6 rounded border-2 transition-all {editingColor === color ? 'border-foreground scale-110' : 'border-transparent'}"
                      style="background-color: {color}"
                      aria-label="色を選択"
                    ></button>
                  {/each}
                </div>
              {:else}
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded border border-border" style="background-color: {label.color}"></div>
                  <span class="text-sm text-muted-foreground font-mono">{label.color}</span>
                </div>
              {/if}
            </div>

            <!-- Type -->
            <div class="col-span-2 text-sm text-muted-foreground">
              {label.type || "-"}
            </div>

            <!-- Actions -->
            <div class="col-span-2 flex justify-end gap-2">
              {#if editingId === label.id}
                <button
                  onclick={() => saveEdit(label.id)}
                  class="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  保存
                </button>
                <button
                  onclick={cancelEdit}
                  class="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted"
                >
                  キャンセル
                </button>
              {:else}
                <button
                  onclick={() => startEdit(label.id, label.name, label.color)}
                  disabled={label.systemFlag}
                  class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onclick={() => handleDeleteLabel(label.id, label.systemFlag)}
                  disabled={label.systemFlag}
                  class="p-2 text-destructive hover:text-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Stats -->
  <div class="mt-6 flex items-center justify-between text-sm text-muted-foreground">
    <div>
      全{labels.length}件のラベル
      {#if searchQuery}
        • {filteredLabels.length}件表示中
      {/if}
    </div>
  </div>
</div>
