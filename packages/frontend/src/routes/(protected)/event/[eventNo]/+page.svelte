<script lang="ts">
  import { page } from '$app/state';
  import { apiPut } from '$lib/api/client';
  import PlaceDisplay from '$lib/components/PlaceDisplay.svelte';
  import type { AttendanceStatus } from '$lib/api/types';

  interface CurrentUser {
    id: string;
    roleId: number;
  }

  interface Attendance {
    id: string;
    playerId: string;
    attendanceStatusIds: string[];
    player: {
      id: string;
      lastName: string;
      firstName: string;
      nickName?: string | null;
      parentUserId: string;
      tags: string[];
    };
    status: {
      name: string;
      color: string;
    };
  }

  // Display name logic: prefer nickName, fallback to lastName + firstName
  function getPlayerDisplayName(player: Attendance['player']): string {
    if (player.nickName) return player.nickName;
    return `${player.lastName} ${player.firstName}`;
  }

  const { data } = $props();
  const eventNo = page.params.eventNo;

  // Use data from load function
  let event = $state<any>(data.event);
  const currentUser = data.currentUser as CurrentUser | null;
  const attendanceStatuses = (data.attendanceStatuses || []) as AttendanceStatus[];
  const error = data.error as string | undefined;

  // Check if user can edit status
  const canEditAny = $derived(currentUser?.roleId === 0 || currentUser?.roleId === 1);

  // Check if user can edit the event itself
  const canEditEvent = $derived.by(() => {
    if (!currentUser || !event) return false;
    // Allow owner, role=0 (Admin), or role=1 (Manager)
    const isOwner = event.ownerId === currentUser.id;
    const hasRole = currentUser.roleId === 0 || currentUser.roleId === 1;
    return isOwner || hasRole;
  });

  function canEditPlayer(att: Attendance): boolean {

    if (canEditAny) return true;
    if (!currentUser) return false;
    return att.player.parentUserId === currentUser.id;
  }

  function isMyChild(att: Attendance): boolean {
    if (!currentUser) return false;
    return att.player.parentUserId === currentUser.id;
  }

  async function updateAttendanceStatus(attendanceId: string, newStatusId: string) {
    if (!data.session?.access_token) return;
    try {
      await apiPut(`/attendances/${attendanceId}`, {
        attendanceStatusId: newStatusId,
      }, data.session.access_token);
      
      // Update local state
      if (event?.attendances) {
        const status = attendanceStatuses.find(s => s.id === newStatusId);
        event = {
          ...event,
          attendances: event.attendances.map((att: Attendance) => 
            att.id === attendanceId 
              ? { ...att, attendanceStatusIds: [newStatusId], status: status ? { name: status.name, color: status.color } : att.status }
              : att
          ),
        };
      }
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('ステータスの更新に失敗しました');
    }
  }
</script>

<div class="container mx-auto px-4 py-6 max-w-2xl">


  {#if error}
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
           {#if event.owner}
             <div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
               イベントオーナー : {event.owner.name}
             </div>
           {/if}
        </div>
        {#if canEditEvent}
          <a
            href="/event/{eventNo}/edit"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            編集
          </a>
        {/if}
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
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="whitespace-pre-wrap">{event.details}</p>
          </div>
        {/if}

        {#if event.place}
          <div class="border-t border-border pt-4 mt-4">
            <h3 class="font-semibold mb-3">場所</h3>
            <PlaceDisplay place={event.place} />
          </div>
        {/if}

        <div class="border-t border-border pt-4 mt-4">
          <h3 class="font-semibold mb-3">対象学年</h3>
          <div class="flex flex-wrap gap-2">
            {#each event.tags.toSorted((a: {name: string}, b: {name: string}) => a.name.localeCompare(b.name)) as tag}
              <span class="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                {tag.name}
              </span>
            {/each}
          </div>
        </div>

        <div class="border-t border-border pt-4 mt-4">
          <h3 class="font-semibold mb-3">参加予定 ({event.attendances?.length || 0}名)</h3>
          <div class="space-y-2">
            {#each event.attendances || [] as att}
              <div 
                class="flex items-center justify-between p-3 rounded-lg border transition-all {isMyChild(att) ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-muted/30 border-border'}"
              >
                <div class="flex items-center gap-3">
                  {#if isMyChild(att)}
                    <span class="text-primary text-lg">★</span>
                  {/if}
                  <div>
                    <span class="font-medium">{getPlayerDisplayName(att.player)}</span>
                    {#if att.player.tags?.length > 0}
                      <span class="ml-2 text-xs text-muted-foreground">
                        {att.player.tags.join(', ')}
                      </span>
                    {/if}
                  </div>
                </div>
                
                {#if canEditPlayer(att)}
                  <select
                    value={att.attendanceStatusIds?.[0] || ''}
                    onchange={(e) => updateAttendanceStatus(att.id, e.currentTarget.value)}
                    class="text-sm border rounded-md py-1 px-2 focus:ring-primary focus:border-primary"
                    style="background-color: {att.status?.color || '#f3f4f6'}20; border-color: {att.status?.color || '#d1d5db'}"
                  >
                    {#each attendanceStatuses as status}
                      <option value={status.id}>{status.name}</option>
                    {/each}
                  </select>
                {:else}
                  <span 
                    class="text-xs px-3 py-1 rounded-full font-medium"
                    style="background-color: {att.status?.color || '#f3f4f6'}20; color: {att.status?.color || '#666'}"
                  >
                    {att.status?.name || '未定'}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>

      </div>
    </div>
  {:else}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      イベントが見つかりませんでした
    </div>
  {/if}
</div>
