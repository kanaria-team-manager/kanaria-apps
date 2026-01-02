<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { apiGet, apiPut } from '$lib/api/client';
  import { fetchAttendanceStatuses, fetchGradeTags } from '$lib/api/master';
  import PlacePicker from '$lib/components/PlacePicker.svelte';
  import type { AttendanceStatus, Tag } from '$lib/api/types';

  interface CurrentUser {
    id: string;
    roleId: number;
  }

  interface Place {
    id: string;
    name: string;
    description?: string | null;
    location?: { x: number; y: number } | null;
  }

  // Same as used in create page player search
  interface Player {
    id: string;
    lastName: string;
    firstName: string;
    nickName?: string | null;
    tags?: string[];
    role?: string;
  }
  
  function getPlayerDisplayName(player: Player): string {
    if (player.nickName) return player.nickName;
    return `${player.lastName} ${player.firstName}`;
  }

  interface EventData {
    id: string;
    eventNo: string;
    title: string;
    details?: string | null;
    startDateTime: string;
    endDateTime: string;
    ownerId: string;
    place?: Place | null;
    placeId?: string | null;
    label?: { id: string; name: string } | null;
    owner?: { id: string; name: string } | null;
    tags?: { id: string; name: string }[];
    attendances?: {
      id: string;
      player: Player;
      attendanceStatusIds: string[];
      status: { name: string; color: string };
    }[];
  }

  const { data } = $props();
  const eventNo = page.params.eventNo;

  // State
  let event = $state<EventData | null>(null);
  let currentUser = $state<CurrentUser | null>(null);
  let places = $state<Place[]>([]);
  let gradeTags = $state<Tag[]>([]);
  let attendanceStatuses = $state<AttendanceStatus[]>([]);
  
  let isLoading = $state(true);
  let isSaving = $state(false);
  let error = $state<string | null>(null);

  // Form state
  let title = $state('');
  let details = $state('');
  let selectedPlaceId = $state('');
  let date = $state('');
  let startTime = $state('');
  let durationMinutes = $state(120);
  let selectedTagIds = $state<string[]>([]);
  
  // Attendance Management State
  // We keep track of the current list of players and their designated status (for new ones)
  // For existing ones, status is just for display (or if we enable updating in future)
  let currentAttendees = $state<{
    player: Player;
    statusId: string;
    statusName?: string;
    statusColor?: string;
    isOriginal: boolean;
  }[]>([]);

  // Search Modal State
  let isSearchModalOpen = $state(false);
  let searchQuery = $state('');
  let searchResults = $state<Player[]>([]);
  let isSearching = $state(false);

  // Derived
  const endTime = $derived.by(() => {
    if (!date || !startTime) return '';
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const canEdit = $derived.by(() => {
    if (!currentUser || !event) return false;
    const isOwner = event.ownerId === currentUser.id;
    const hasRole = currentUser.roleId === 0 || currentUser.roleId === 1;
    return isOwner || hasRole;
  });

  // Default status helper
  const defaultStatusId = $derived.by(() => {
    if (attendanceStatuses.length === 0) return "";
    const waiting = attendanceStatuses.find(s => s.name === "回答待ち");
    if (waiting) return waiting.id;
    const system = attendanceStatuses.find(s => s.systemFlag);
    if (system) return system.id;
    return attendanceStatuses[0].id;
  });

  $effect(() => {
    if (!data.session?.access_token) return;
    (async () => {
      try {
        const [eventData, userData, placesData, tagsData, statusesData] = await Promise.all([
          apiGet<EventData>(`/events/${eventNo}`, data.session.access_token),
          apiGet<CurrentUser>('/users/me', data.session.access_token),
          apiGet<Place[]>('/places', data.session.access_token),
          fetchGradeTags(window.fetch, data.session.access_token),
          fetchAttendanceStatuses(window.fetch, data.session.access_token),
        ]);
        event = eventData;
        currentUser = userData;
        places = placesData;
        gradeTags = tagsData;
        attendanceStatuses = statusesData;

        // Check permission
        const isOwner = eventData.ownerId === userData.id;
        const hasRole = userData.roleId === 0 || userData.roleId === 1;
        if (!isOwner && !hasRole) {
          goto(`/event/${eventNo}`);
          return;
        }

        // Populate form
        title = eventData.title;
        details = eventData.details || '';
        selectedPlaceId = eventData.placeId || eventData.place?.id || '';
        
        const startDT = new Date(eventData.startDateTime);
        const endDT = new Date(eventData.endDateTime);
        date = startDT.toISOString().split('T')[0];
        startTime = startDT.toTimeString().slice(0, 5);
        durationMinutes = Math.round((endDT.getTime() - startDT.getTime()) / (60 * 1000));
        
        selectedTagIds = eventData.tags?.map(t => t.id) || [];

        // Populate attendees
        if (eventData.attendances) {
          currentAttendees = eventData.attendances.map(att => ({
            player: att.player,
            statusId: att.attendanceStatusIds[0] || '',
            statusName: att.status?.name,
            statusColor: att.status?.color,
            isOriginal: true
          }));
        }

      } catch (e) {
        console.error(e);
        error = 'イベントの取得に失敗しました';
      } finally {
        isLoading = false;
      }
    })();
  });

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter(id => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
  }

  // Search Modal Functions
  function openSearchModal() {
    isSearchModalOpen = true;
    searchQuery = "";
    searchResults = [];
  }

  function closeSearchModal() {
    isSearchModalOpen = false;
  }

  async function searchPlayers() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }
    
    isSearching = true;
    try {
      const results = await apiGet<Player[]>(`/players?q=${encodeURIComponent(searchQuery)}`, data.session?.access_token);
      // Filter out players already in list
      const existingIds = new Set(currentAttendees.map(a => a.player.id));
      searchResults = results.filter(p => !existingIds.has(p.id));
    } catch (e) {
      console.error("Failed to search players", e);
    } finally {
      isSearching = false;
    }
  }

  function addPlayerFromSearch(player: Player) {
    if (!currentAttendees.find(a => a.player.id === player.id)) {
      currentAttendees = [...currentAttendees, {
        player,
        statusId: defaultStatusId,
        isOriginal: false
      }];
    }
    // Remove from search results
    searchResults = searchResults.filter(p => p.id !== player.id);
  }

  function removePlayer(playerId: string) {
    currentAttendees = currentAttendees.filter(a => a.player.id !== playerId);
  }

  // Sort attendees for display (Tags then Name)
  const sortedAttendees = $derived.by(() => {
    return [...currentAttendees].sort((a, b) => {
      const tagA = a.player.tags?.[0] || '';
      const tagB = b.player.tags?.[0] || '';
      const tagCompare = tagA.localeCompare(tagB);
      if (tagCompare !== 0) return tagCompare;
      
      const nameA = getPlayerDisplayName(a.player);
      const nameB = getPlayerDisplayName(b.player);
      return nameA.localeCompare(nameB);
    });
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!title.trim() || !date || !startTime) {
      error = '必須項目を入力してください';
      return;
    }

    isSaving = true;
    error = null;

    try {
      const startDateTime = new Date(`${date}T${startTime}`).toISOString();
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      const endDateTime = end.toISOString();

      await apiPut(`/events/${eventNo}`, {
        title: title.trim(),
        details: details.trim() || undefined,
        placeId: selectedPlaceId || null,
        startDateTime,
        endDateTime,
        tagIds: selectedTagIds,
        attendances: currentAttendees.map(a => ({
          playerId: a.player.id,
          attendanceStatusId: a.statusId
        }))
      }, data.session?.access_token);

      goto(`/event/${eventNo}`);
    } catch (e) {
      console.error(e);
      error = '保存に失敗しました';
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    goto(`/event/${eventNo}`);
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-6">
    <a href="/event/{eventNo}" class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      詳細に戻る
    </a>
  </div>

  {#if isLoading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error && !event}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      {error}
    </div>
  {:else if event && canEdit}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {event.label?.name || 'Event'}
          </span>
          <span class="text-xs text-muted-foreground">#{event.eventNo}</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900">イベントを編集</h1>
      </div>

      <form onsubmit={handleSubmit} class="p-6 space-y-6">
        {#if error}
          <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" x2="12" y1="8" y2="12"/>
              <line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            {error}
          </div>
        {/if}

        <!-- Title -->
        <div class="space-y-2">
          <label for="title" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              <path d="M10 9H8"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
            </svg>
            タイトル <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            placeholder="例：練習試合 vs ABCサッカークラブ"
            required
            class="w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
          />
        </div>

        <!-- Details -->
        <div class="space-y-2">
          <label for="details" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
              <line x1="4" x2="20" y1="9" y2="9"/>
              <line x1="4" x2="20" y1="15" y2="15"/>
              <line x1="10" x2="8" y1="3" y2="21"/>
              <line x1="16" x2="14" y1="3" y2="21"/>
            </svg>
            詳細
          </label>
          <textarea
            id="details"
            bind:value={details}
            placeholder="イベントの詳細情報を入力してください..."
            class="w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 min-h-[120px]"
          ></textarea>
        </div>

        <!-- Place -->
        <PlacePicker 
          {places} 
          value={selectedPlaceId} 
          onchange={(id) => selectedPlaceId = id} 
        />
        
        <!-- Tags -->
        <div class="space-y-3">
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-5-5z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                タグ（複数選択可）
            </span>
            <div class="flex flex-wrap gap-2">
                {#each gradeTags as tag}
                    <button
                        type="button"
                        onclick={() => toggleTag(tag.id)}
                        class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105 active:scale-95 {selectedTagIds.includes(tag.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}"
                    >
                        {tag.name}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Date & Time Section -->
        <div class="space-y-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 class="flex items-center gap-2 font-semibold text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            日時設定
          </h3>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <label for="date" class="block text-sm font-medium text-gray-700">
                イベント日 <span class="text-red-500">*</span>
              </label>
              <input
                id="date"
                type="date"
                bind:value={date}
                required
                class="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label for="startTime" class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                開始時刻 <span class="text-red-500">*</span>
              </label>
              <input
                id="startTime"
                type="time"
                bind:value={startTime}
                required
                class="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label for="duration" class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                所要時間 (分)
              </label>
              <div class="flex items-center gap-2">
                <input
                  id="duration"
                  type="number"
                  bind:value={durationMinutes}
                  min="15"
                  step="15"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {#if endTime}
                  <span class="text-sm text-gray-500 whitespace-nowrap">→ {endTime}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Players -->
        <div class="space-y-3">
            <span class="flex items-center justify-between text-sm font-semibold text-gray-900">
                <span class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    出欠者リスト（{currentAttendees.length}名）
                </span>
                <button
                    type="button"
                    onclick={openSearchModal}
                    class="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    プレイヤー検索
                </button>
            </span>
            
            <div class="max-h-[300px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div class="overflow-y-auto max-h-[300px] p-2 space-y-1">
                    {#each sortedAttendees as att (att.player.id)}
                        <div class="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors">
                            <div class="flex flex-1 items-center gap-3">
                                <div class="flex flex-col">
                                    <span class="font-medium text-gray-700">{getPlayerDisplayName(att.player)}</span>
                                    {#if att.player.tags && att.player.tags.length > 0}
                                        <span class="text-xs text-gray-400">{att.player.tags.join(', ')}</span>
                                    {/if}
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <!-- Existing user: Show current status (Read only) -->
                                {#if att.isOriginal}
                                    <span 
                                        class="text-xs px-2 py-1 rounded-full font-medium"
                                        style="background-color: {att.statusColor || '#f3f4f6'}20; color: {att.statusColor || '#666'}"
                                    >
                                        {att.statusName || '未定'}
                                    </span>
                                {:else}
                                    <!-- New user: Can select status -->
                                    <select
                                        bind:value={att.statusId}
                                        class="text-xs border-gray-200 rounded-md py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {#each attendanceStatuses as status}
                                            <option value={status.id}>{status.name}</option>
                                        {/each}
                                    </select>
                                {/if}
                                
                                <button
                                    type="button"
                                    onclick={() => removePlayer(att.player.id)}
                                    title="削除"
                                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                    {/each}
                    
                    {#if sortedAttendees.length === 0}
                        <div class="py-8 text-center text-gray-400 text-sm">
                            プレイヤーが追加されていません
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            class="flex-1 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onclick={handleCancel}
            class="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-gray-200 transition-all"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  {:else if event && !canEdit}
    <div class="bg-destructive/10 text-destructive p-4 rounded-lg">
      このイベントを編集する権限がありません。
    </div>
  {/if}
</div>

<!-- Player Search Modal -->
{#if isSearchModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div 
            class="absolute inset-0 bg-black/50" 
            onclick={closeSearchModal}
            role="presentation"
        ></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div class="p-4 border-b border-gray-100">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-lg font-semibold text-gray-900">プレイヤー検索</h2>
                    <button
                        type="button"
                        onclick={closeSearchModal}
                        aria-label="閉じる"
                        class="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div class="flex gap-2">
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="名前で検索..."
                        class="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        onkeydown={(e) => e.key === 'Enter' && searchPlayers()}
                    />
                    <button
                        type="button"
                        onclick={searchPlayers}
                        disabled={isSearching}
                        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isSearching ? '検索中...' : '検索'}
                    </button>
                </div>
            </div>
            
            <div class="overflow-y-auto max-h-[50vh] p-2">
                {#if searchResults.length > 0}
                    {#each searchResults as player}
                        <div class="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors">
                            <div class="flex flex-col">
                                <span class="font-medium text-gray-700">{getPlayerDisplayName(player)}</span>
                                {#if player.tags && player.tags.length > 0}
                                    <span class="text-xs text-gray-400">{player.tags.join(', ')}</span>
                                {/if}
                            </div>
                            <button
                                type="button"
                                onclick={() => addPlayerFromSearch(player)}
                                class="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                追加
                            </button>
                        </div>
                    {/each}
                {:else if searchQuery && !isSearching}
                    <div class="py-8 text-center text-gray-400 text-sm">
                        検索結果がありません
                    </div>
                {:else}
                    <div class="py-8 text-center text-gray-400 text-sm">
                        名前を入力して検索してください
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
