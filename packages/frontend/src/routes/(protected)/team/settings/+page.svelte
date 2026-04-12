<script lang="ts">
import { apiGet, apiPut } from "$lib/api/client";

const MAX_INPUT_LENGTH = 500;

interface Team {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

let { data } = $props();

let team = $state<Team | null>(null);
let isLoading = $state(true);
let isSaving = $state(false);

let formName = $state("");
let formDescription = $state("");

let errorMessage = $state("");
let successMessage = $state("");

async function fetchTeam() {
  if (!data.session?.access_token) return;
  isLoading = true;
  try {
    const fetchedTeam = await apiGet<Team>("/teams/settings", data.session.access_token);
    team = fetchedTeam;
    formName = team.name || "";
    formDescription = team.description || "";
  } catch (e) {
    console.error("Failed to fetch team", e);
    errorMessage = "チーム情報の取得に失敗しました。";
  } finally {
    isLoading = false;
  }
}

async function saveTeam(e: Event) {
  e.preventDefault();
  if (!data.session?.access_token) return;
  
  errorMessage = "";
  successMessage = "";
  
  if (formName.trim() === "") {
    errorMessage = "チーム名は必須です。";
    return;
  }
  
  if (formName.length > MAX_INPUT_LENGTH || formDescription.length > MAX_INPUT_LENGTH) {
    errorMessage = `${MAX_INPUT_LENGTH}文字以内で入力してください。`;
    return;
  }

  isSaving = true;
  try {
    const updatedTeam = await apiPut<Team>(
      "/teams/settings",
      { name: formName, description: formDescription },
      data.session.access_token
    );
    team = updatedTeam;
    successMessage = "チーム情報を更新しました。";
  } catch (err) {
    console.error("Failed to update team", err);
    errorMessage = "チーム情報の更新に失敗しました。";
  } finally {
    isSaving = false;
  }
}

$effect(() => {
  if (data.session) {
    fetchTeam();
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

  {#if isLoading}
    <div class="text-center py-12 text-muted-foreground">読み込み中...</div>
  {:else if team}
    <div class="rounded-lg border border-border bg-card">
      <form onsubmit={saveTeam} class="p-6 space-y-6">
        
        {#if errorMessage}
          <div class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMessage}
          </div>
        {/if}
        {#if successMessage}
          <div class="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {successMessage}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="teamCode" class="block text-sm font-medium text-muted-foreground">チームコード (変更不可)</label>
          <input
            id="teamCode"
            type="text"
            value={team.code}
            disabled
            class="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground cursor-not-allowed shadow-sm focus:outline-none"
          />
          <p class="text-xs text-muted-foreground">メンバーを招待する際に使用するコードです。</p>
        </div>

        <div class="space-y-2">
          <label for="teamName" class="block text-sm font-medium text-muted-foreground">チーム名 <span class="text-destructive">*</span></label>
          <input
            id="teamName"
            type="text"
            bind:value={formName}
            maxlength={MAX_INPUT_LENGTH}
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          <p class="text-xs text-muted-foreground">{formName.length} / {MAX_INPUT_LENGTH} 文字</p>
        </div>

        <div class="space-y-2">
          <label for="teamDescription" class="block text-sm font-medium text-muted-foreground">チーム詳細</label>
          <textarea
            id="teamDescription"
            rows="4"
            bind:value={formDescription}
            maxlength={MAX_INPUT_LENGTH}
            class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
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
      <p class="text-destructive mb-4">{errorMessage || "チーム情報の読み込みに失敗しました。"}</p>
      <button
        type="button"
        onclick={fetchTeam}
        class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
      >
        再試行
      </button>
    </div>
  {/if}
</div>
