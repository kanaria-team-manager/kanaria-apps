<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import MapPicker from '$lib/components/MapPicker.svelte';
  
  const { data, form } = $props();
  const id = page.params.id;

  // Use data from load function, form data for persistence on error
  const place = data.place;
  const loadError = data.error as string | undefined;

  // Form state (initialized from load data, updated from form on error)
  let name = $state(form?.name ?? place?.name ?? '');
  let description = $state(form?.description ?? place?.description ?? '');
  let isSubmitting = $state(false);
  
  // Parse location from loaded place
  const initialLocation = (() => {
    if (!place?.location) return null;
    if (Array.isArray(place.location)) {
      return { x: place.location[0], y: place.location[1] };
    }
    return place.location as { x: number; y: number };
  })();
  let location = $state<{x: number, y: number} | null>(initialLocation);

  // Handle successful update
  $effect(() => {
    if (form?.success) {
      goto(`/places/${id}`);
    }
  });
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">場所の編集</h1>
        <p class="text-muted-foreground mt-1">登録されている場所の情報を変更します</p>
      </div>
      <!-- アクションボタン領域（必要な場合はここに追加） -->
    </div>
    <a href="/places/{id}" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      詳細に戻る
    </a>
  </div>

  <div class="rounded-lg border border-border bg-card">
    <div class="p-6">
      {#if (form?.error || loadError) && !place}
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
          {form?.error || loadError}
        </div>
      {:else if place}
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
              href="/places/{id}"
              class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center justify-center"
            >
              キャンセル
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              class="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      {:else}
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
          場所が見つかりませんでした
        </div>
      {/if}
    </div>
  </div>
</div>
