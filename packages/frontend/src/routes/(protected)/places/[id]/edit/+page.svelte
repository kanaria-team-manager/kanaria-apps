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

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/places/{id}" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      詳細に戻る
    </a>
  </div>

  {#if (form?.error || loadError) && !place}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {form?.error || loadError}
    </div>
  {:else if place}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">場所を編集</h1>
      </div>
      
      <form 
        method="POST" 
        class="p-6 space-y-6"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}
      >
        {#if form?.error}
          <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {form.error}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="name" class="block text-sm font-medium text-gray-700">
            場所名 <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            bind:value={name}
            required
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="block text-sm font-medium text-gray-700">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          ></textarea>
        </div>

      <!-- Hidden input to pass location as JSON -->
      <input type="hidden" name="location" value={location ? JSON.stringify(location) : ''} />

      <!-- Map Component -->
      <div class="space-y-2">
        <span class="block text-sm font-medium text-gray-700">地図</span>
        <div class="h-80 border border-gray-200 rounded-lg overflow-hidden relative z-0">
           {#if typeof window !== 'undefined'}
              <MapPicker 
                value={location} 
                onchange={(val: {x: number, y: number}) => location = val}
              />
           {/if}
        </div>
        <p class="text-xs text-gray-500">地図をクリックして場所を指定してください。</p>
      </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            class="flex-1 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
          <a
            href="/places/{id}"
            class="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200 transition-all text-center"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      場所が見つかりませんでした
    </div>
  {/if}
</div>
