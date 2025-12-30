<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { apiGet, apiPut } from '$lib/api/client';
  import MapPicker from '$lib/components/MapPicker.svelte';
  
  const { data } = $props();
  const id = $page.params.id;

  let name = $state('');
  let description = $state('');
  let isLoading = $state(true);
  let isSubmitting = $state(false);
  let error = $state<string | null>(null);
  let location = $state<{x: number, y: number} | null>(null);

  $effect(() => {
    if (!data.session?.access_token) return;
    (async () => {
       try {
        const place = await apiGet<any>(`/places/${id}`, data.session.access_token);
        name = place.name;
        description = place.description || '';
        if (place.location) {
          if (Array.isArray(place.location)) {
             location = { x: place.location[0], y: place.location[1] };
          } else {
             location = place.location;
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

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!data.session?.access_token) return;
    
    isSubmitting = true;
    error = null;

    try {
      await apiPut(`/places/${id}`, {
        name,
        description,
        location
      }, data.session.access_token);
      goto('/places');
    } catch (e) {
      console.error(e);
      error = "更新に失敗しました";
    } finally {
      isSubmitting = false;
    }
  }
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
  
  <h1 class="text-2xl font-bold mb-6">場所の編集</h1>

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-6">
      <div class="space-y-2">
        <label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          場所名 <span class="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          bind:value={name}
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div class="space-y-2">
        <label for="description" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          説明
        </label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        ></textarea>
      </div>

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
          {isSubmitting ? '更新中...' : '更新'}
        </button>
      </div>
    </form>
  {/if}
</div>
