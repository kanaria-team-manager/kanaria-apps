<script lang="ts">
  import MapPicker from './MapPicker.svelte';
  import { browser } from '$app/environment';

  interface Place {
    id: string;
    name: string;
    description?: string | null;
    location?: { x: number; y: number } | [number, number] | null;
  }

  const {
    places = [],
    value = '',
    onchange,
  } = $props<{
    places: Place[];
    value?: string;
    onchange?: (placeId: string) => void;
  }>();

  // Derived: find the selected place
  const selectedPlace = $derived(places.find((p: Place) => p.id === value) || null);

  // Normalize location: handle both array [x, y] and object {x, y} formats
  const normalizedLocation = $derived.by(() => {
    if (!selectedPlace?.location) return null;
    
    let x: number | undefined;
    let y: number | undefined;
    
    if (Array.isArray(selectedPlace.location)) {
      [x, y] = selectedPlace.location;
    } else if (typeof selectedPlace.location === 'object') {
      x = selectedPlace.location.x;
      y = selectedPlace.location.y;
    }
    
    // Ensure both x and y are valid numbers
    if (typeof x === 'number' && typeof y === 'number' && !Number.isNaN(x) && !Number.isNaN(y)) {
      return { x, y };
    }
    
    return null;
  });

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    if (onchange) {
      onchange(target.value);
    }
  }
</script>

<div class="space-y-3">
  <div class="space-y-2">
    <label for="place-select" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      場所
    </label>
    <div class="relative">
      <select
        id="place-select"
        {value}
        onchange={handleChange}
        class="w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white"
      >
        <option value="">場所を選択（任意）</option>
        {#each places as place}
          <option value={place.id}>{place.name}</option>
        {/each}
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>

  {#if normalizedLocation}
    <div class="space-y-2">
      <span class="text-sm font-medium text-gray-700">地図</span>
      <div class="h-48 border rounded-md overflow-hidden relative z-0">
        {#if browser}
          <MapPicker value={normalizedLocation} readonly={true} />
        {/if}
      </div>
    </div>
  {/if}
</div>
