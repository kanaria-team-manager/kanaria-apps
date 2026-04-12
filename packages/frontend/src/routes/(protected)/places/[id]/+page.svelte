<script lang="ts">
  import { page } from '$app/state';
  import MapPicker from '$lib/components/MapPicker.svelte';

  const { data } = $props();
  const id = page.params.id;

  // Use data from load function
  const place = data.place;
  const error = data.error as string | undefined;
  
  // location for MapPicker {x, y}
  const location = $derived.by(() => {
    if (!place?.location) return null;
    if (Array.isArray(place.location)) {
      return { x: place.location[0], y: place.location[1] };
    }
    return place.location;
  });
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">場所の詳細</h1>
        <p class="text-muted-foreground mt-1">登録されている場所の詳細情報を確認します</p>
      </div>
      <a 
        href="/places/{id}/edit"
        class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center gap-2 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        編集
      </a>
    </div>
    <a href="/places" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      一覧に戻る
    </a>
  </div>

  <div class="rounded-lg border border-border bg-card">
    {#if error}
      <div class="p-6">
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    {:else if place}
      <!-- Header Info -->
      <div class="p-6 border-b border-border bg-muted/20">
        <h2 class="text-xl font-bold text-foreground">{place.name}</h2>
        <p class="text-muted-foreground mt-2">{place.description || '説明なし'}</p>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Map -->
        <div>
          <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">地図</h3>
          <div class="h-80 border border-border rounded-lg overflow-hidden relative z-0">
            {#if typeof window !== 'undefined'}
              <MapPicker 
                value={location} 
                readonly={true}
              />
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="p-6">
        <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
          場所が見つかりませんでした
        </div>
      </div>
    {/if}
  </div>
</div>
