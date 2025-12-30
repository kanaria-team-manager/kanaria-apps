<script lang="ts">
  import MapPicker from './MapPicker.svelte';
  import { browser } from '$app/environment';

  interface Place {
    name: string;
    description?: string | null;
    location?: { x: number; y: number } | [number, number] | null;
  }

  const { place } = $props<{ place: Place }>();

  // Normalize location: handle both array [x, y] and object {x, y} formats
  const normalizedLocation = $derived.by(() => {
    if (!place.location) return null;
    if (Array.isArray(place.location)) {
      return { x: place.location[0], y: place.location[1] };
    }
    return place.location;
  });
</script>

<div class="space-y-3">
  <div class="flex items-start gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <div>
      <h4 class="font-semibold text-foreground">{place.name}</h4>
      {#if place.description}
        <p class="text-sm text-muted-foreground">{place.description}</p>
      {/if}
    </div>
  </div>

  {#if normalizedLocation}
    <div class="space-y-2">
      <span class="text-sm font-medium">地図</span>
      <div class="h-48 border rounded-md overflow-hidden relative z-0">
        {#if browser}
          <MapPicker value={normalizedLocation} readonly={true} />
        {/if}
      </div>
    </div>
  {/if}
</div>
