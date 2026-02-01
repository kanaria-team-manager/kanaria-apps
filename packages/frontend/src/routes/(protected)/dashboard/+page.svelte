<script lang="ts">
import CalendarView from "$lib/domains/dashboard/components/calendar-view.svelte";
import FilterPanel from "$lib/domains/dashboard/components/filter-panel.svelte";

import ListView from "$lib/domains/dashboard/components/list-view.svelte";
import Sidebar from "$lib/domains/dashboard/components/sidebar.svelte";

let { data } = $props();

let currentView = $state<"calendar" | "list">(
  (data.config?.events?.viewMode) ?? "calendar"
);
let selectedGrades = $state<string[]>(
  (data.config?.events?.filterGrades) ?? []
);
let selectedTypes = $state<string[]>(
  (data.config?.events?.filterLabelIds) ?? []
);
let selectedDate = $state<Date | null>(null);
let currentMonth = $state<Date>(new Date());
let sidebarOpen = $state<boolean>(false);
let username = $state<string>("");

let { tags, labels, config } = data;

// claims から email を取得（user_metadata がない場合のフォールバック）
$effect(() => {
  username = data.user?.user_metadata?.name || data.user?.email || "";
});

// Map Backend Data to UI
const grades = $derived(tags ? tags.map((t) => t.name) : []);

// Labels are already filtered by type='event' from server, use directly
const eventTypes = $derived(
  labels
    ? labels.map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color || "#6b7280", // Use label color from DB, fallback to gray
        type: l.type,
      }))
    : [],
);

import { apiGet } from "$lib/api/client";

// State - must be declared before labelStats which references it
let events = $state<any[]>([]);

// Grade-filtered events for sidebar stats (only grade filter applied, not label filter)
const gradeFilteredEvents = $derived(
  events.filter((event) => {
    return selectedGrades.length === 0 || event.grades.some((g: string) => selectedGrades.includes(g));
  }),
);

// Compute label stats for sidebar (label name, color, and event count)
const labelStats = $derived(
  eventTypes.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    count: gradeFilteredEvents.filter((e) => e.type === label.id).length,
  })),
);

// Helper to find ID by name for mock data
const getLabelId = (name: string) =>
  labels?.find((l) => l.name === name)?.id || name;

async function fetchEvents() {
    if (!data.session?.access_token) return;
    
    // Fetch events from previous month to next month for calendar display
    // Start: first day of previous month
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // End: last day of next month
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
    
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
  <Sidebar 
    bind:open={sidebarOpen}
    {grades}
    {eventTypes}
    {labelStats}
    {selectedGrades}
    {selectedTypes}
    {toggleGrade}
    {toggleType}
    {clearFilters}
  />
  
  <main class="p-4 md:p-6 lg:p-8">
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
