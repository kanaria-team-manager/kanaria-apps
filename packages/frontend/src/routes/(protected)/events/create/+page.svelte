<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { apiGet, apiPost } from "$lib/api/client";
import { fetchAttendanceStatuses, fetchGradeTags, fetchLabels } from "$lib/api/master";
import type { AttendanceStatus, Label, Tag } from "$lib/api/types";
import type { Session, User } from "@supabase/supabase-js";
import { onMount } from "svelte";
import PlacePicker from '$lib/components/PlacePicker.svelte';

// Types
interface Player {
  id: string;
  name: string;
  tags?: string[];
  role?: string;
}

interface Place {
  id: string;
  name: string;
  description?: string | null;
  location?: { x: number; y: number } | null;
}

let { data } = $props();
const session: Session | null = data.session;

// State - Form
let title = $state("");
let description = $state("");
let selectedLabelId = $state("");
let selectedPlaceId = $state("");
let date = $state(page.url.searchParams.get("date") || "");
let startTime = $state("09:00");
let durationMinutes = $state(120);

// State - Data
let labels = $state<Label[]>([]);
let tags = $state<Tag[]>([]);
let attendanceStatuses = $state<AttendanceStatus[]>([]);
let allPlayers = $state<Player[]>([]);
let places = $state<Place[]>([]);

let selectedTagIds = $state<string[]>([]);
// Map of playerId -> statusId. Presence in map implies selection.
let selectedAttendances = $state<Map<string, string>>(new Map());

// State - UI
let isLoading = $state(false);
let isSubmitting = $state(false);
let error = $state("");

// Derived
const endTime = $derived.by(() => {
    if (!date || !startTime) return "";
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Helper to find default status
const defaultStatusId = $derived.by(() => {
    if (attendanceStatuses.length === 0) return "";
    const waiting = attendanceStatuses.find(s => s.name === "回答待ち");
    if (waiting) return waiting.id;
    const system = attendanceStatuses.find(s => s.systemFlag);
    if (system) return system.id;
    return attendanceStatuses[0].id;
});

onMount(async () => {
    if (!session) return;
    isLoading = true;
    try {
        const [l, t, s, p] = await Promise.all([
            fetchLabels(window.fetch, session.access_token, 'event'),
            fetchGradeTags(window.fetch),
            fetchAttendanceStatuses(window.fetch, session.access_token),
            apiGet<Place[]>('/places', session.access_token),
        ]);
        labels = l;
        tags = t;
        attendanceStatuses = s;
        places = p;
    } catch (e) {
        console.error(e);
        error = "Failed to load data";
    } finally {
        isLoading = false;
    }
});

async function fetchFilteredPlayers() {
    if (selectedTagIds.length === 0) {
        allPlayers = [];
        return;
    }
    
    // Build query params for multiple tagIds
    const params = new URLSearchParams();
    selectedTagIds.forEach(id => params.append("tagIds", id));
    
    try {
        const players = await apiGet<Player[]>(`/players?${params.toString()}`, session?.access_token);
        allPlayers = players;
        
        // Auto-select newly fetched players with default status
        if (defaultStatusId) {
            const newMap = new Map(selectedAttendances);
            let changed = false;
            for (const p of players) {
                if (!newMap.has(p.id)) {
                    newMap.set(p.id, defaultStatusId);
                    changed = true;
                }
            }
            if (changed) selectedAttendances = newMap;
        }
    } catch (e) {
        console.error("Failed to fetch players", e);
    }
}

function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
        selectedTagIds = selectedTagIds.filter(id => id !== tagId);
    } else {
        selectedTagIds = [...selectedTagIds, tagId];
    }
    fetchFilteredPlayers();
}

function togglePlayer(playerId: string) {
    const newMap = new Map(selectedAttendances);
    if (newMap.has(playerId)) {
        newMap.delete(playerId);
    } else {
        newMap.set(playerId, defaultStatusId);
    }
    selectedAttendances = newMap;
}

function updatePlayerStatus(playerId: string, statusId: string) {
    const newMap = new Map(selectedAttendances);
    newMap.set(playerId, statusId);
    selectedAttendances = newMap;
}

function selectAllFiltered() {
    const newMap = new Map(selectedAttendances);
    for (const player of allPlayers) {
        if (!newMap.has(player.id)) {
            newMap.set(player.id, defaultStatusId);
        }
    }
    selectedAttendances = newMap;
}

function deselectAllFiltered() {
    const newMap = new Map(selectedAttendances);
    for (const player of allPlayers) {
        newMap.delete(player.id);
    }
    selectedAttendances = newMap;
}

function clearForm() {
    title = "";
    description = "";
    selectedLabelId = "";
    selectedPlaceId = "";
    selectedTagIds = [];
    startTime = "09:00";
    durationMinutes = 120;
    
    // Reset players
    const newMap = new Map();
    selectedAttendances = newMap;
    allPlayers = [];
}

async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!title || !selectedLabelId || !date || !startTime) {
        error = "必須項目を入力してください";
        return;
    }
    
    isSubmitting = true;
    error = "";
    
    try {
        const startDateTime = new Date(`${date}T${startTime}`).toISOString();
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        const endDateTime = end.toISOString();
        
        // Convert Map to Array for API
        const attendances = Array.from(selectedAttendances.entries()).map(([playerId, statusId]) => ({
            playerId,
            attendanceStatusId: statusId
        }));
        
        await apiPost("/events", {
            title,
            details: description,
            labelId: selectedLabelId,
            placeId: selectedPlaceId || undefined,
            startDateTime,
            endDateTime,
            tagIds: selectedTagIds,
            attendances // New payload structure
        }, session?.access_token);
        
        goto("/dashboard");
    } catch (e) {
        console.error(e);
        error = "作成に失敗しました";
    } finally {
        isSubmitting = false;
    }
}
</script>

<div class="max-w-3xl mx-auto py-8 px-4">
    <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="p-6 md:p-8 space-y-8">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-900">予定を作成</h1>

            </div>

            {#if isLoading}
                <div class="flex justify-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            {:else}
                <form onsubmit={handleSubmit} class="space-y-6">
                    <!-- Title -->
                    <div class="space-y-2">
                        <label for="title" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <!-- FileText Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
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

                    <!-- Description -->
                    <div class="space-y-2">
                        <label for="description" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <!-- Hash Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
                            詳細
                        </label>
                        <textarea
                            id="description"
                            bind:value={description}
                            placeholder="イベントの詳細情報を入力してください..."
                            class="w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 min-h-[120px]"
                        ></textarea>
                    </div>

                    <!-- Label -->
                    <div class="space-y-2">
                        <label for="label" class="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <!-- Tag Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-5-5z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                            ラベル <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <select
                                id="label"
                                bind:value={selectedLabelId}
                                required
                                class="w-full px-3 py-2 border border-gray-200 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white"
                            >
                                <option value="" disabled>イベントタイプを選択</option>
                                {#each labels as label}
                                    <option value={label.id}>{label.name}</option>
                                {/each}
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
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
                            <!-- Tag Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-5-5z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                            タグ（複数選択可）
                        </span>
                        <div class="flex flex-wrap gap-2">
                            {#each tags as tag}
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
                            <!-- Calendar Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            日時設定
                        </h3>

                        <div class="grid gap-4 md:grid-cols-3">
                            <div class="space-y-2">
                                <label for="date" class="block text-sm font-medium text-gray-700">イベント日 <span class="text-red-500">*</span></label>
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
                                    <!-- Clock Icon -->
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
                                    <!-- Clock Icon -->
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
                                <!-- Users Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                出欠者リスト（{selectedAttendances.size}名選択中）
                            </span>
                        </span>
                        
                        <div class="max-h-[300px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div class="overflow-y-auto max-h-[300px] p-2 space-y-1">
                                {#each allPlayers as player}
                                    <div class="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors group">
                                        <input
                                            id="p-{player.id}"
                                            type="checkbox"
                                            checked={selectedAttendances.has(player.id)}
                                            onchange={() => togglePlayer(player.id)}
                                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div class="flex flex-1 items-center justify-between gap-4">
                                            <label for="p-{player.id}" class="flex-1 flex flex-col cursor-pointer">
                                                <span class="font-medium text-gray-700 group-hover:text-gray-900">{player.name}</span>
                                                {#if player.tags && player.tags.length > 0}
                                                    <span class="text-xs text-gray-400">{player.tags.join(', ')}</span>
                                                {/if}
                                            </label>
                                            
                                            <!-- Status Select -->
                                            <select
                                                disabled={!selectedAttendances.has(player.id)}
                                                value={selectedAttendances.get(player.id) || defaultStatusId}
                                                onchange={(e) => updatePlayerStatus(player.id, e.currentTarget.value)}
                                                class="text-sm border-gray-200 rounded-md py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                                                onclick={(e) => e.stopPropagation()}
                                            >
                                                {#each attendanceStatuses as status}
                                                    <option value={status.id}>{status.name}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>
                                {/each}
                                {#if allPlayers.length === 0}
                                    <div class="py-8 text-center text-gray-400 text-sm">
                                        表示するプレイヤーがいません
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    
                    {#if error}
                        <div class="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                            {error}
                        </div>
                    {/if}

                    <div class="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            class="flex-1 bg-indigo-600 text-white text-base font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? '作成中...' : 'イベントを作成'}
                        </button>
                        <button
                            type="button"
                            onclick={clearForm}
                            class="px-6 py-3 bg-transparent text-gray-600 font-medium hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                        >
                            クリア
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
</div>
