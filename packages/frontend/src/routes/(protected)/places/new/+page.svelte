<script lang="ts">
  import { enhance } from '$app/forms';
  import MapPicker from '$lib/components/MapPicker.svelte';
  
  const { form } = $props();

  // Form state (use form data for persistence on error)
  let name = $state(form?.name || '');
  let description = $state(form?.description || '');
  let location = $state<{x: number, y: number} | null>(null);
  let isSubmitting = $state(false);
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">場所の新規作成</h1>
        <p class="text-muted-foreground mt-1">練習や試合で利用する新しい場所の情報を入力してください</p>
      </div>
      <!-- アクションボタン領域（必要な場合はここに追加） -->
    </div>
    <a href="/places" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      一覧に戻る
    </a>
  </div>

  <div class="rounded-lg border border-border bg-card">
    <div class="p-6">
      {#if form?.error}
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {form.error}
        </div>
      {/if}

      <form 
        method="POST" 
        class="space-y-6 max-w-2xl"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}
      >
        <div class="space-y-2">
          <label for="name" class="block text-sm font-medium text-muted-foreground">
            場所名 <span class="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            bind:value={name}
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="例: 第1グラウンド"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="block text-sm font-medium text-muted-foreground">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={description}
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="詳細情報や注意事項など"
          ></textarea>
        </div>

        <!-- Hidden input to pass location as JSON -->
        <input type="hidden" name="location" value={location ? JSON.stringify(location) : ''} />

        <!-- Map Component -->
        <div class="space-y-2">
          <span class="block text-sm font-medium text-muted-foreground">地図</span>
          <div class="h-80 border border-border rounded-md overflow-hidden relative z-0">
             {#if typeof window !== 'undefined'}
                <MapPicker 
                  value={location} 
                  onchange={(val: {x: number, y: number}) => location = val} 
                />
             {/if}
          </div>
          <p class="text-xs text-muted-foreground">地図をクリックして場所を指定してください。</p>
        </div>

        <div class="flex justify-end gap-4 pt-4">
          <a 
            href="/places"
            class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            キャンセル
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            class="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
