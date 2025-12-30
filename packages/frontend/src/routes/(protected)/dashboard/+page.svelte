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

// Mock Data using DB IDs/Names
// Note: Using $derived to react to labels loading
const events = $derived([
  {
    id: 1,
    title: "練習試合 vs 青葉FC",
    type: getLabelId("試合"),
    date: new Date(2025, 11, 7, 9, 0),
    grades: ["6年生"],
    location: "市民グラウンド",
  },
  {
    id: 2,
    title: "通常練習",
    type: getLabelId("練習"),
    date: new Date(2025, 11, 8, 16, 0),
    grades: ["4年生", "5年生"],
    location: "学校グラウンド",
  },
  {
    id: 3,
    title: "市大会 予選リーグ",
    type: getLabelId("試合"),
    date: new Date(2025, 11, 14, 10, 0),
    grades: ["6年生"],
    location: "総合運動公園",
  },
  {
    id: 4,
    title: "通常練習",
    type: getLabelId("練習"),
    date: new Date(2025, 11, 15, 16, 0),
    grades: ["1年生", "2年生"],
    location: "学校グラウンド",
  },
  {
    id: 5,
    title: "保護者会",
    type: getLabelId("イベント"),
    date: new Date(2025, 11, 20, 19, 0),
    grades: ["1年生", "2年生", "3年生", "4年生", "5年生", "6年生"],
    location: "コミュニティセンター",
  },
  {
    id: 6,
    title: "カップ戦",
    type: getLabelId("試合"),
    date: new Date(2025, 11, 21, 8, 30),
    grades: ["4年生"],
    location: "隣市スタジアム",
  },
  {
    id: 7,
    title: "通常練習",
    type: getLabelId("練習"),
    date: new Date(2025, 11, 22, 16, 0),
    grades: ["5年生", "6年生"],
    location: "学校グラウンド",
  },
  {
    id: 8,
    title: "通常練習",
    type: getLabelId("練習"),
    date: new Date(2025, 11, 6, 16, 0),
    grades: ["1年生", "2年生"],
    location: "学校グラウンド",
  },
  {
    id: 9,
    title: "フレンドリーマッチ",
    type: getLabelId("試合"),
    date: new Date(2025, 11, 28, 14, 0),
    grades: ["6年生"],
    location: "県営グラウンド",
  },
  {
    id: 10,
    title: "夏合宿説明会",
    type: getLabelId("イベント"),
    date: new Date(2025, 11, 25, 18, 30),
    grades: ["4年生", "5年生", "6年生"],
    location: "オンライン",
  },
]);

const filteredEvents = $derived(
  events.filter((event) => {
    const gradeMatch =
      selectedGrades.length === 0 ||
      event.grades.some((g) => selectedGrades.includes(g));
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

function handleDateSelect(date: Date) {
  selectedDate = date;
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

