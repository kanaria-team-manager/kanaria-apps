<script lang="ts">
let { events, eventTypes = [] } = $props();

const sortedEvents = $derived(
  [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
);

function formatDate(date: Date): string {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function isUpcoming(date: Date): boolean {
  return date.getTime() >= new Date().setHours(0, 0, 0, 0);
}

function getTypeIcon(typeId: number | string): string {
  const typeInfo = eventTypes.find((t) => t.id === typeId);
  if (!typeInfo) return "";

  // Fallback logic for icons based on label name (since fetched data doesn't have icon info yet)
  // Or we could check color if consistent.
  if (typeInfo.label === "試合") {
    return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
  } else if (typeInfo.label === "練習") {
    return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`;
  }
  // Default event icon
  return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`;
}
</script>

<div class="space-y-3">
  <!-- Access sortedEvents as value, not function -->
  {#if sortedEvents.length === 0}
    <div class="bg-card border border-border rounded-xl p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-muted-foreground">該当する予定はありません</p>
    </div>
  {:else}
    {#each sortedEvents as event}
      {@const typeInfo = eventTypes.find(t => t.id === event.type)}
      <div class="
        bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow
        {!isUpcoming(event.date) ? 'opacity-60' : ''}
      ">
        <div class="flex items-start gap-4">
          <!-- Type indicator -->
          <div class="
            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
            {typeInfo ? typeInfo.color.replace('bg-', 'bg-') + '-light' : 'bg-gray-100'} 
            {typeInfo ? typeInfo.color + '/10' : 'bg-gray-100'}
          ">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="w-6 h-6 {typeInfo ? typeInfo.color.replace('bg-', 'text-') : 'text-gray-500'}"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {@html getTypeIcon(event.type)}
            </svg>
          </div>

          <!-- Event details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold text-foreground truncate">{event.title}</h3>
              <span class="
                flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full
                {typeInfo ? typeInfo.color + '/10 ' + typeInfo.color.replace('bg-', 'text-') : 'bg-gray-100 text-gray-800'}
              ">
                {typeInfo ? typeInfo.label : 'Event'}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.date)}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(event.date)}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </span>
            </div>

            <!-- Grade tags -->
            <div class="mt-3 flex flex-wrap gap-1">
              {#each event.grades as grade}
                <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {grade}
                </span>
              {/each}
            </div>
          </div>

          <!-- Action button -->
          <button class="flex-shrink-0 p-2 rounded-lg hover:bg-hover transition-colors" aria-label="View details">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    {/each}
  {/if}
</div>
