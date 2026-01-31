<script lang="ts">
import { enhance } from "$app/forms";
import type { Tag } from "$lib/api/types";

const { data, form } = $props();

// State
let isSubmitting = $state(false);
let tagSearch = $state("");

// Config values with defaults
let eventsViewMode = $state(data.config?.events?.viewMode || "calendar");
let eventsFilterTagIds = $state<string[]>(
  data.config?.events?.filterTagIds || [],
);

let playersViewMode = $state(data.config?.players?.viewMode || "card");
let playersItemsPerPage = $state(data.config?.players?.itemsPerPage || 50);

let notifFromHour = $state(
  data.config?.notifications?.emailTimeRange?.fromHour ?? 7,
);
let notifToHour = $state(
  data.config?.notifications?.emailTimeRange?.toHour ?? 20,
);

// Tags
const allTags: Tag[] = data.allTags || [];
const selectedTags = $derived(
  allTags.filter((tag) => eventsFilterTagIds.includes(tag.id)),
);

const filteredTags = $derived.by(() => {
  if (!tagSearch.trim()) return [];
  const search = tagSearch.toLowerCase();
  return allTags
    .filter(
      (tag) =>
        tag.name.toLowerCase().includes(search) &&
        !eventsFilterTagIds.includes(tag.id),
    )
    .slice(0, 5);
});

function addTag(tag: Tag) {
  eventsFilterTagIds = [...eventsFilterTagIds, tag.id];
  tagSearch = "";
}

function removeTag(tagId: string) {
  eventsFilterTagIds = eventsFilterTagIds.filter((id) => id !== tagId);
}

// Hours array for select options
const hours = Array.from({ length: 24 }, (_, i) => i);
</script>

<div class="container mx-auto px-4 py-6 max-w-3xl">
  <h1 class="text-2xl font-bold mb-6">設定</h1>

  {#if data.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {data.error}
    </div>
  {/if}

  <form
    method="POST"
    action="?/updateConfig"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update({ invalidateAll: true });
        isSubmitting = false;
      };
    }}
  >
    <!-- Events Section -->
    <div class="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
      <h2 class="text-xl font-semibold mb-4">デフォルトの表示設定</h2>

      <div class="space-y-6">
        <!-- Events View Mode -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-muted-foreground">
            予定 - 表示形式
          </label>
          <select
            name="eventsViewMode"
            bind:value={eventsViewMode}
            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="calendar">カレンダー</option>
            <option value="list">リスト</option>
          </select>
        </div>

        <!-- Events Tag Filter -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-muted-foreground">
            予定 - フィルター（タグ選択）
          </label>

          <!-- Tag search -->
          <div class="relative">
            <input
              type="text"
              bind:value={tagSearch}
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="タグを検索して追加..."
            />

            {#if filteredTags.length > 0}
              <div
                class="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto"
              >
                {#each filteredTags as tag}
                  <button
                    type="button"
                    onclick={() => addTag(tag)}
                    class="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                  >
                    <span class="text-primary">+</span>
                    {tag.name}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Selected tags -->
          <div class="flex flex-wrap gap-2 min-h-[2rem]">
            {#each selectedTags as tag (tag.id)}
              <span
                class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag.name}
                <button
                  type="button"
                  onclick={() => removeTag(tag.id)}
                  class="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label="タグを削除"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
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
              </span>
            {/each}
            {#if selectedTags.length === 0}
              <span class="text-sm text-muted-foreground"
                >フィルターなし（全て表示）</span
              >
            {/if}
          </div>

          <!-- Hidden input for form submission -->
          <input
            type="hidden"
            name="eventsFilterTagIds"
            value={JSON.stringify(eventsFilterTagIds)}
          />
        </div>

        <div class="border-t border-border pt-6">
          <!-- Players View Mode -->
          <div class="space-y-2 mb-4">
            <label class="block text-sm font-medium text-muted-foreground">
              プレイヤー - 表示形式
            </label>
            <select
              name="playersViewMode"
              bind:value={playersViewMode}
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="card">カード</option>
              <option value="list">リスト</option>
            </select>
          </div>

          <!-- Players Items Per Page -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-muted-foreground">
              プレイヤー - 表示数
            </label>
            <select
              name="playersItemsPerPage"
              bind:value={playersItemsPerPage}
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Section -->
    <div class="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
      <h2 class="text-xl font-semibold mb-4">通知設定</h2>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-muted-foreground">
          メールを受け取る時刻設定
        </label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-muted-foreground mb-1"
              >From（開始時刻）</label
            >
            <select
              name="notifFromHour"
              bind:value={notifFromHour}
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {#each hours as hour}
                <option value={hour}>{hour}:00</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1"
              >To（終了時刻）</label
            >
            <select
              name="notifToHour"
              bind:value={notifToHour}
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {#each hours as hour}
                <option value={hour}>{hour}:00</option>
              {/each}
            </select>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          この時間帯にメール通知を受け取ります
        </p>
      </div>
    </div>

    <!-- Form Error -->
    {#if form?.error}
      <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
        {form.error}
      </div>
    {/if}

    <!-- Form Success -->
    {#if form?.success}
      <div class="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
        設定を保存しました
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="flex gap-3">
      <button
        type="submit"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "保存中..." : "設定を保存"}
      </button>
      <a href="/user" class="px-4 py-2 border border-input rounded-md hover:bg-accent"
        >キャンセル</a
      >
    </div>
  </form>
</div>
