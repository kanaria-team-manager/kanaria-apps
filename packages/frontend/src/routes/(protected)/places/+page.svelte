<script lang="ts">
  import { goto } from '$app/navigation';
  import { apiGet, apiDelete } from '$lib/api/client';

  const { data } = $props();

  let places = $state<any[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  async function fetchPlaces() {
    if (!data.session?.access_token) return;
    isLoading = true;
    try {
      places = await apiGet('/places', data.session.access_token);
    } catch (e) {
      console.error(e);
      error = "場所の取得に失敗しました";
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(e: Event, id: string) {
    e.stopPropagation();
    if (!confirm('本当に削除しますか？')) return;
    if (!data.session?.access_token) return;
    
    try {
      await apiDelete(`/places/${id}`, data.session.access_token);
      places = places.filter(p => p.id !== id);
    } catch(e) {
      console.error(e);
      alert('削除に失敗しました');
    }
  }

  $effect(() => {
    fetchPlaces();
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">場所管理</h1>
    <a 
      href="/places/new"
      class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      新規作成
    </a>
  </div>

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      {error}
    </div>
  {:else if places.length === 0}
    <div class="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-border">
      <p>場所が登録されていません</p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each places as place}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            class="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow transition-shadow cursor-pointer"
            onclick={() => goto(`/places/${place.id}`)}
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-lg">{place.name}</h3>
            <div class="flex gap-2">
              <button 
                onclick={(e) => handleDelete(e, place.id)}
                class="text-sm text-destructive hover:text-destructive/80 p-1"
                aria-label="削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          {#if place.description}
            <p class="text-sm text-muted-foreground line-clamp-2 mb-2">{place.description}</p>
          {/if}
          {#if place.location}
            <div class="flex items-center gap-1 text-xs text-muted-foreground mt-2">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               地図情報あり
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
