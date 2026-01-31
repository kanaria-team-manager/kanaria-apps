<script lang="ts">
import { enhance } from "$app/forms";
import type { Tag, Label } from "$lib/api/types";

const { data, form } = $props();

// State
let isSubmitting = $state(false);

// Config values with defaults
let eventsViewMode = $state(data.config?.events?.viewMode || "calendar");
let eventsFilterGrades = $state<string[]>(
  data.config?.events?.filterGrades || [],
);
let eventsFilterLabelIds = $state<string[]>(
  data.config?.events?.filterLabelIds || [],
);

let playersViewMode = $state(data.config?.players?.viewMode || "card");
let playersItemsPerPage = $state(data.config?.players?.itemsPerPage || 50);

let notifFromHour = $state(
  data.config?.notifications?.emailTimeRange?.fromHour ?? 7,
);
let notifToHour = $state(
  data.config?.notifications?.emailTimeRange?.toHour ?? 20,
);


// Data from server
const allTags: Tag[] = data.allTags || [];
const labels: Label[] = data.labels || [];

// Get grade label ID and filter grade tags
const gradeLabel = $derived(labels.find((l) => l.name === "学年"));
const gradeTags = $derived(
  gradeLabel
    ? allTags.filter((tag) => tag.labelId === gradeLabel.id)
    : [],
);

// Toggle functions
function toggleGrade(gradeName: string) {
  if (eventsFilterGrades.includes(gradeName)) {
    eventsFilterGrades = eventsFilterGrades.filter((g) => g !== gradeName);
  } else {
    eventsFilterGrades = [...eventsFilterGrades, gradeName];
  }
}

function toggleLabel(labelId: string) {
  if (eventsFilterLabelIds.includes(labelId)) {
    eventsFilterLabelIds = eventsFilterLabelIds.filter((id) => id !== labelId);
  } else {
    eventsFilterLabelIds = [...eventsFilterLabelIds, labelId];
  }
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

  <!-- Form Success -->
  {#if form?.success}
    <div class="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
      設定を保存しました
    </div>
  {/if}

  <!-- Form Error -->
  {#if form?.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    action="?/updateConfig"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update({ invalidateAll: false, reset: false });
        isSubmitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

        <!-- Grade Filter -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-muted-foreground">
            予定 - 学年フィルター
          </label>
          <p class="text-xs text-muted-foreground mb-2">
            選択した学年の予定のみを表示します
          </p>
          <div class="flex flex-wrap gap-2">
            {#each gradeTags as gradeTag}
              <button
                type="button"
                onclick={() => toggleGrade(gradeTag.name)}
                class="px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  {eventsFilterGrades.includes(gradeTag.name)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-hover'}"
              >
                {gradeTag.name}
              </button>
            {/each}
            {#if gradeTags.length === 0}
              <p class="text-sm text-muted-foreground">学年タグがありません</p>
            {/if}
          </div>
          <input
            type="hidden"
            name="eventsFilterGrades"
            value={JSON.stringify(eventsFilterGrades)}
          />
        </div>

        <!-- Label Filter -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-muted-foreground">
            予定 - 種類フィルター
          </label>
          <p class="text-xs text-muted-foreground mb-2">
            選択した種類の予定のみを表示します
          </p>
          <div class="space-y-2">
            {#each labels as label}
              <button
                type="button"
                onclick={() => toggleLabel(label.id)}
                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                  {eventsFilterLabelIds.includes(label.id)
                    ? 'bg-accent ring-2 ring-primary'
                    : 'hover:bg-hover'}"
              >
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  style="background-color: {label.color}"
                ></span>
                <span class="text-sm text-foreground">{label.name}</span>
                {#if eventsFilterLabelIds.includes(label.id)}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 ml-auto text-primary flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {/if}
              </button>
            {/each}
            {#if labels.length === 0}
              <p class="text-sm text-muted-foreground">ラベルがありません</p>
            {/if}
          </div>
          <input
            type="hidden"
            name="eventsFilterLabelIds"
            value={JSON.stringify(eventsFilterLabelIds)}
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
