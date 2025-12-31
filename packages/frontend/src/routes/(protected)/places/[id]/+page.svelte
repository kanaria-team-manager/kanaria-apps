<script lang="ts">
  import { page } from '$app/state';
  import { apiGet } from '$lib/api/client';
  import MapPicker from '$lib/components/MapPicker.svelte';

  const { data } = $props();
  const id = page.params.id;

  let place = $state<any>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  // location for MapPicker {x, y}
  let location = $state<{x: number, y: number} | null>(null);

  $effect(() => {
    if (!data.session?.access_token) return;
    (async () => {
      try {
        const res = await apiGet<any>(`/places/${id}`, data.session.access_token);
        place = res;
        
        if (res.location) {
          if (Array.isArray(res.location)) {
             location = { x: res.location[0], y: res.location[1] };
          } else {
             location = res.location;
          }
        }
      } catch (e) {
        console.error(e);
        error = "場所の取得に失敗しました";
      } finally {
        isLoading = false;
      }
    })();
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

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else if place}
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-2xl font-bold">{place.name}</h1>
            <p class="text-muted-foreground mt-1">{place.description || '説明なし'}</p>
        </div>
        <a 
            href={`/places/${id}/edit`} 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
            編集
        </a>
    </div>

    <!-- Map Component (Read-only) -->
    <div class="space-y-2">
      <span class="text-sm font-medium">地図</span>
      <div class="h-80 border rounded-md overflow-hidden relative z-0">
         {#if typeof window !== 'undefined'}
            <MapPicker 
              value={location} 
              readonly={true}
            />
         {/if}
      </div>
    </div>
  {/if}
</div>
