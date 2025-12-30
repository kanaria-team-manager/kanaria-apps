<script lang="ts">
import CalendarView from "$lib/domains/dashboard/components/calendar-view.svelte";
import FilterPanel from "$lib/domains/dashboard/components/filter-panel.svelte";

import ListView from "$lib/domains/dashboard/components/list-view.svelte";
import Sidebar from "$lib/domains/dashboard/components/sidebar.svelte";

let currentView = $state("calendar");
let selectedGrades = $state<string[]>([]);
let selectedTypes = $state<string[]>([]);
let selectedDate = $state<Date | null>(null);
let currentMonth = $state<Date>(new Date());
let sidebarOpen = $state<boolean>(false);
let username = $state<string>("");

let { data } = $props();
let { tags, labels } = data;

// claims から email を取得（user_metadata がない場合のフォールバック）
$effect(() => {
  username = data.user?.user_metadata?.name || data.user?.email || "";
});

// Map Backend Data to UI
const grades = $derived(tags ? tags.map((t) => t.name) : []);

const eventTypes = $derived(
  labels
    ? labels.map((l) => {
        let color = "bg-gray-500"; // Default
        if (l.name === "試合") color = "bg-match";
        if (l.name === "練習") color = "bg-practice";
        if (l.name === "イベント") color = "bg-event";
        return {
          id: l.id,
          label: l.name,
          color,
        };
      })
    : [],
);

// Helper to find ID by name for mock data
const getLabelId = (name: string) =>
  labels?.find((l) => l.name === name)?.id || name;

import { apiGet } from "$lib/api/client";

// State
let events = $state<any[]>([]);

async function fetchEvents() {
    if (!data.session?.access_token) return;
    
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString()
    });

    try {
        const res = await apiGet<any[]>(`/events?${params.toString()}`, data.session.access_token);
        events = res.map(e => ({
            id: e.id,
            eventNo: e.eventNo,
            title: e.title,
            type: e.label?.id,
            date: new Date(e.startDateTime),
            grades: e.tags?.map((t: any) => t.name) || [],
            location: e.details || ""
        }));
    } catch (e) {
        console.error("Failed to fetch events", e);
    }
}

$effect(() => {
  if (currentMonth && data.session) {
      fetchEvents();
  }
});

const filteredEvents = $derived(
  events.filter((event) => {
    const gradeMatch =
      selectedGrades.length === 0 ||
      event.grades.some((g: string) => selectedGrades.includes(g));
    const typeMatch =
      selectedTypes.length === 0 || selectedTypes.includes(event.type);
    const dateMatch =
      !selectedDate ||
      event.date.toDateString() === selectedDate.toDateString();
    return gradeMatch && typeMatch && dateMatch;
  }),
);

function toggleGrade(grade: string) {
  if (selectedGrades.includes(grade)) {
    selectedGrades = selectedGrades.filter((g) => g !== grade);
  } else {
    selectedGrades = [...selectedGrades, grade];
  }
}

function toggleType(type: string) {
  if (selectedTypes.includes(type)) {
    selectedTypes = selectedTypes.filter((t) => t !== type);
  } else {
    selectedTypes = [...selectedTypes, type];
  }
}

function clearFilters() {
  selectedGrades = [];
  selectedTypes = [];
  selectedDate = null;
}

import { goto } from "$app/navigation";

function handleDateSelect(date: Date) {
  // YYYY-MM-DD format (local time)
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  const dateStr = localDate.toISOString().split('T')[0];
  goto(`/events/create?date=${dateStr}`);
}
</script>

<div class="min-h-screen bg-background text-foreground">

  <h1>username : {username}</h1>
 
  <div class="flex">
    <Sidebar 
      bind:open={sidebarOpen}
      {grades}
      {eventTypes}
      {selectedGrades}
      {selectedTypes}
      {toggleGrade}
      {toggleType}
      {clearFilters}
    />
    
    <main class="flex-1 p-4 md:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto">
        <FilterPanel 
          bind:currentView
          bind:currentMonth
          {selectedGrades}
          {selectedTypes}
          {selectedDate}
          {clearFilters}
          {eventTypes}
          toggleSidebar={() => (sidebarOpen = !sidebarOpen)}
        />
        
        <!-- Access filteredEvents as value, not function -->
        {#if currentView === 'calendar'}
          <CalendarView 
            events={filteredEvents}
            {currentMonth}
            {handleDateSelect}
            {selectedDate}
            {eventTypes}
          />
        {:else}
          <ListView events={filteredEvents} {eventTypes} />
        {/if}
      </div>
    </main>
  </div>
</div>

