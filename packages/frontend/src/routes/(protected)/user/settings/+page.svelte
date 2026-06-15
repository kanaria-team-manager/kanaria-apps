<script lang="ts">
import { enhance } from "$app/forms";
import type { Tag, Label } from "@kanaria/shared";

import { untrack } from 'svelte';

const { data, form } = $props();

// State
let isSubmitting = $state(false);

// Config values with defaults
let eventsViewMode = $state(untrack(() => data.config?.events?.viewMode || "calendar"));
let eventsFilterGrades = $state<string[]>(untrack(() => data.config?.events?.filterGrades || []));
let eventsFilterLabelIds = $state<string[]>(untrack(() => data.config?.events?.filterLabelIds || []));

let playersViewMode = $state(untrack(() => data.config?.players?.viewMode || "card"));
let playersItemsPerPage = $state(untrack(() => data.config?.players?.itemsPerPage || 50));

let notifFromHour = $state(untrack(() => data.config?.notifications?.emailTimeRange?.fromHour ?? 7));
let notifToHour = $state(untrack(() => data.config?.notifications?.emailTimeRange?.toHour ?? 20));


// Data from server
const allTags: Tag[] = $derived(data.allTags || []);
const labels: Label[] = $derived(data.labels || []);

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

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">個人設定</h1>
        <p class="text-muted-foreground mt-1">アプリケーションの表示形式や通知に関する設定を行います</p>
      </div>
    </div>
  </div>

  {#if data.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {data.error}
    </div>
  {/if}

  <!-- Form Success -->
  {#if form?.success}
    <div class="bg-green-100/50 text-green-700 p-4 rounded-lg mb-6 border border-green-200">
      設定を保存しました
    </div>
  {/if}

  <!-- Form Error -->
  {#if form?.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 border border-destructive/20">
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
    <div class="bg-card border border-border rounded-lg mb-6 overflow-hidden">
      <div class="p-6">
        <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          デフォルトの表示設定
        </h2>

        <div class="space-y-6">
          <!-- Events View Mode -->
          <div class="space-y-2">
            <label for="eventsViewMode" class="block text-sm font-medium text-muted-foreground">
              予定 - 表示形式
            </label>
            <select
              id="eventsViewMode"
              name="eventsViewMode"
              bind:value={eventsViewMode}
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="calendar">カレンダー</option>
              <option value="list">リスト</option>
            </select>
          </div>

          <!-- Grade Filter -->
          <div class="space-y-2">
            <div class="block text-sm font-medium text-muted-foreground">
              予定 - 学年フィルター
            </div>
            <p class="text-xs text-muted-foreground mb-3">
              選択した学年の予定のみを表示します
            </p>
            <div class="flex flex-wrap gap-2">
              {#each gradeTags as gradeTag}
                <button
                  type="button"
                  onclick={() => toggleGrade(gradeTag.name)}
                  class="px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    {eventsFilterGrades.includes(gradeTag.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 border'}"
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
            <div class="block text-sm font-medium text-muted-foreground">
              予定 - 種類フィルター
            </div>
            <p class="text-xs text-muted-foreground mb-3">
              選択した種類の予定のみを表示します
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each labels as label}
                <button
                  type="button"
                  onclick={() => toggleLabel(label.id)}
                  class="flex items-center gap-3 px-3 py-2 rounded-lg border transition-all
                    {eventsFilterLabelIds.includes(label.id)
                      ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                      : 'border-border hover:bg-muted'}"
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

          <div class="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Players View Mode -->
            <div class="space-y-2">
              <label for="playersViewMode" class="block text-sm font-medium text-muted-foreground">
                プレイヤー - 表示形式
              </label>
              <select
                id="playersViewMode"
                name="playersViewMode"
                bind:value={playersViewMode}
                class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="card">カード</option>
                <option value="list">リスト</option>
              </select>
            </div>

            <!-- Players Items Per Page -->
            <div class="space-y-2">
              <label for="playersItemsPerPage" class="block text-sm font-medium text-muted-foreground">
                プレイヤー - 表示数
              </label>
              <select
                id="playersItemsPerPage"
                name="playersItemsPerPage"
                bind:value={playersItemsPerPage}
                class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Section -->
    <div class="bg-card border border-border rounded-lg mb-8 overflow-hidden">
      <div class="p-6">
        <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          通知設定
        </h2>

        <div class="space-y-4">
          <div class="block text-sm font-medium text-muted-foreground">
            メールを受け取る時刻設定
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="notifFromHour" class="block text-xs text-muted-foreground mb-1.5"
                >開始時刻</label
              >
              <select
                id="notifFromHour"
                name="notifFromHour"
                bind:value={notifFromHour}
                class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {#each hours as hour}
                  <option value={hour}>{hour}:00</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="notifToHour" class="block text-xs text-muted-foreground mb-1.5"
                >終了時刻</label
              >
              <select
                id="notifToHour"
                name="notifToHour"
                bind:value={notifToHour}
                class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {#each hours as hour}
                  <option value={hour}>{hour}:00</option>
                {/each}
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            この時間帯にメール通知を受け取ります
          </p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="flex items-center gap-4 pt-2">
      <button
        type="submit"
        class="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? "保存中..." : "設定を保存"}
      </button>
      <a href="/user" class="px-6 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >キャンセル</a
      >
    </div>
  </form>
</div>

