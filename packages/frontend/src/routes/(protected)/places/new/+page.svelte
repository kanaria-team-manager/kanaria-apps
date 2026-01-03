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

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/places" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      一覧に戻る
    </a>
  </div>
  
  <h1 class="text-2xl font-bold mb-6">場所の新規作成</h1>

  {#if form?.error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {form.error}
    </div>
  {/if}

  <form 
    method="POST" 
    class="space-y-6"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        await update();
        isSubmitting = false;
      };
    }}
  >
    <div class="space-y-2">
      <label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        場所名 <span class="text-destructive">*</span>
      </label>
      <input
        id="name"
        name="name"
        type="text"
        bind:value={name}
        required
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="例: 第1グラウンド"
      />
    </div>

    <div class="space-y-2">
      <label for="description" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        説明
      </label>
      <textarea
        id="description"
        name="description"
        bind:value={description}
        rows="3"
        class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="詳細情報や注意事項など"
      ></textarea>
    </div>

    <!-- Hidden input to pass location as JSON -->
    <input type="hidden" name="location" value={location ? JSON.stringify(location) : ''} />

    <!-- Map Component -->
    <div class="space-y-2">
      <span class="text-sm font-medium">地図</span>
      <div class="h-80 border rounded-md overflow-hidden relative z-0">
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
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
      >
        キャンセル
      </a>
      <button
        type="submit"
        disabled={isSubmitting}
        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        {isSubmitting ? '保存中...' : '保存'}
      </button>
    </div>
  </form>
</div>
