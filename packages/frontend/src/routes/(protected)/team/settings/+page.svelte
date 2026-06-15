<script lang="ts">
import { enhance } from "$app/forms";

const MAX_INPUT_LENGTH = 500;
const FIELD_BASE_CLASSES = "w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-sm";
const FIELD_DISABLED_CLASSES = "w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground cursor-not-allowed shadow-sm focus:outline-none";

interface Team {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

let { data, form } = $props();

let team = $derived(data.team);
let formName = $state(team?.name || "");
let formDescription = $state(team?.description || "");
let isSaving = $state(false);

$effect(() => {
  if (data.team) {
    formName = data.team.name || "";
    formDescription = data.team.description || "";
  }
});
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">チーム管理</h1>
        <p class="text-muted-foreground mt-1">チームの基本情報を管理します。</p>
      </div>
    </div>
  </div>

  {#if team}
    <div class="rounded-lg border border-border bg-card">
      <form 
        method="POST"
        action="?/updateTeam"
        use:enhance={() => {
          isSaving = true;
          return async ({ update }) => {
            await update();
            isSaving = false;
          };
        }}
        class="p-6 space-y-6"
      >
        
        {#if data.error || form?.error}
          <div class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {data.error || form?.error}
          </div>
        {/if}
        {#if form?.success}
          <div class="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            チーム情報を更新しました。
          </div>
        {/if}

        <div class="space-y-2">
          <label for="teamCode" class="block text-sm font-medium text-muted-foreground">チームコード (変更不可)</label>
          <input
            id="teamCode"
            type="text"
            value={team.code}
            disabled
            class={FIELD_DISABLED_CLASSES}
          />
          <p class="text-xs text-muted-foreground">メンバーを招待する際に使用するコードです。</p>
        </div>

        <div class="space-y-2">
          <label for="teamName" class="block text-sm font-medium text-muted-foreground">チーム名 <span class="text-destructive">*</span></label>
          <input
            id="teamName"
            name="name"
            type="text"
            bind:value={formName}
            maxlength={MAX_INPUT_LENGTH}
            required
            class={FIELD_BASE_CLASSES}
          />
          <p class="text-xs text-muted-foreground">{formName.length} / {MAX_INPUT_LENGTH} 文字</p>
        </div>

        <div class="space-y-2">
          <label for="teamDescription" class="block text-sm font-medium text-muted-foreground">チーム詳細</label>
          <textarea
            id="teamDescription"
            name="description"
            rows="4"
            bind:value={formDescription}
            maxlength={MAX_INPUT_LENGTH}
            class={FIELD_BASE_CLASSES}
          ></textarea>
          <p class="text-xs text-muted-foreground">{formDescription.length} / {MAX_INPUT_LENGTH} 文字</p>
        </div>

        <div class="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            class="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-destructive mb-4">{data.error || "チーム情報の読み込みに失敗しました。"}</p>
      <a
        href="/dashboard"
        class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors inline-block"
      >
        戻る
      </a>
    </div>
  {/if}
</div>
