<script lang="ts">
  import { page } from '$app/stores';
  import { apiGet } from '$lib/api/client';
  import { onMount } from 'svelte';

  const { data } = $props();
  const eventNo = $page.params.eventNo;

  let event = $state<any>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    if (!data.session?.access_token) return;
    try {
      event = await apiGet(`/events/${eventNo}`, data.session.access_token);
    } catch (e) {
      console.error(e);
      error = "イベントの取得に失敗しました";
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container mx-auto px-4 py-6 max-w-2xl">
  <div class="mb-6">
    <a href="/dashboard" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      ダッシュボードに戻る
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
  {:else if event}
    <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div class="flex items-start justify-between mb-4">
        <div>
           <div class="flex items-center gap-2 mb-2">
             <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
               {event.label?.name || 'Event'}
             </span>
             <span class="text-xs text-muted-foreground">#{event.eventNo}</span>
           </div>
           <h1 class="text-2xl font-bold">{event.title}</h1>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-3 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(event.startDateTime).toLocaleDateString()} {new Date(event.startDateTime).toLocaleTimeString()} ~ {new Date(event.endDateTime).toLocaleTimeString()}</span>
        </div>

        {#if event.details}
          <div class="flex items-start gap-3 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p class="whitespace-pre-wrap">{event.details}</p>
          </div>
        {/if}

        <div class="border-t border-border pt-4 mt-4">
          <h3 class="font-semibold mb-3">対象学年</h3>
          <div class="flex flex-wrap gap-2">
            {#each event.tags as tag}
              <span class="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                {tag.name}
              </span>
            {/each}
          </div>
        </div>

        <div class="border-t border-border pt-4 mt-4">
          <h3 class="font-semibold mb-3">参加予定 ({event.attendances?.length || 0}名)</h3>
          <!-- Player list placeholder or implementation -->
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {#each event.attendances || [] as att}
               <div class="flex items-center justify-between p-2 bg-muted/50 rounded">
                 <span>{att.player?.name}</span>
                 <!-- Status display could be improved with color mapping if we had status master data -->
                 <span class="text-xs bg-card px-2 py-1 rounded border border-border">
                    {att.attendanceStatusIds?.[0] || '未定'}
                 </span>
               </div>
             {/each}
           </div>
        </div>

      </div>
    </div>
  {/if}
</div>
