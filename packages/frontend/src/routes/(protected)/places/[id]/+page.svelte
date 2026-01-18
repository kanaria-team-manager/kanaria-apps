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

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/places" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      一覧に戻る
    </a>
  </div>

  {#if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else if place}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="relative bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div class="absolute top-4 right-4">
          <a 
            href="/places/{id}/edit"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            編集
          </a>
        </div>
        
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{place.name}</h1>
          <p class="text-gray-500 mt-1">{place.description || '説明なし'}</p>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Map -->
        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">地図</h3>
          <div class="h-80 border border-gray-200 rounded-lg overflow-hidden relative z-0">
            {#if typeof window !== 'undefined'}
              <MapPicker 
                value={location} 
                readonly={true}
              />
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      場所が見つかりませんでした
    </div>
  {/if}
</div>
