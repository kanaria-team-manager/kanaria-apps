<script lang="ts">
import Sidebar from '$lib/domains/dashboard/components/sidebar.svelte';
import CalendarView from '$lib/domains/dashboard/components/calendar-view.svelte';

import ListView from '$lib/domains/dashboard/components/list-view.svelte';
import FilterPanel from '$lib/domains/dashboard/components/filter-panel.svelte';

let currentView = $state('calendar');
let selectedGrades = $state<string[]>([]);
let selectedTypes = $state<string[]>([]);
let selectedDate = $state<Date | null>(null);
let currentMonth = $state<Date>(new Date());
let sidebarOpen = $state<boolean>(false);
let username = $state<string>("");

  let { data } = $props();
  let { user } = data;

  if (user) {
    username = user.user_metadata.name;
  }

const grades = ['U-6', 'U-8', 'U-10', 'U-12', 'U-14', 'U-16'];
const eventTypes = [
	{ id: 'match', label: '試合', color: 'bg-match' },
	{ id: 'practice', label: '練習', color: 'bg-practice' },
	{ id: 'event', label: 'イベント', color: 'bg-event' }
];

const events = [
	{ id: 1, title: '練習試合 vs 青葉FC', type: 'match', date: new Date(2025, 5, 7, 9, 0), grades: ['U-12'], location: '市民グラウンド' },
	{ id: 2, title: '通常練習', type: 'practice', date: new Date(2025, 5, 8, 16, 0), grades: ['U-10', 'U-12'], location: '学校グラウンド' },
	{ id: 3, title: '市大会 予選リーグ', type: 'match', date: new Date(2025, 5, 14, 10, 0), grades: ['U-14'], location: '総合運動公園' },
	{ id: 4, title: '通常練習', type: 'practice', date: new Date(2025, 5, 15, 16, 0), grades: ['U-8', 'U-10'], location: '学校グラウンド' },
	{ id: 5, title: '保護者会', type: 'event', date: new Date(2025, 5, 20, 19, 0), grades: ['U-6', 'U-8', 'U-10', 'U-12', 'U-14', 'U-16'], location: 'コミュニティセンター' },
	{ id: 6, title: 'カップ戦', type: 'match', date: new Date(2025, 5, 21, 8, 30), grades: ['U-10'], location: '隣市スタジアム' },
	{ id: 7, title: '通常練習', type: 'practice', date: new Date(2025, 5, 22, 16, 0), grades: ['U-12', 'U-14'], location: '学校グラウンド' },
	{ id: 8, title: '通常練習', type: 'practice', date: new Date(2025, 5, 6, 16, 0), grades: ['U-6', 'U-8'], location: '学校グラウンド' },
	{ id: 9, title: 'フレンドリーマッチ', type: 'match', date: new Date(2025, 5, 28, 14, 0), grades: ['U-16'], location: '県営グラウンド' },
	{ id: 10, title: '夏合宿説明会', type: 'event', date: new Date(2025, 5, 25, 18, 30), grades: ['U-10', 'U-12', 'U-14'], location: 'オンライン' },
];

const filteredEvents = $derived(
	events.filter(event => {
		const gradeMatch = selectedGrades.length === 0 || 
			event.grades.some(g => selectedGrades.includes(g));
		const typeMatch = selectedTypes.length === 0 || 
			selectedTypes.includes(event.type);
		const dateMatch = !selectedDate || 
			event.date.toDateString() === selectedDate.toDateString();
		return gradeMatch && typeMatch && dateMatch;
	})
);

function toggleGrade(grade: string) {
	if (selectedGrades.includes(grade)) {
		selectedGrades = selectedGrades.filter(g => g !== grade);
	} else {
		selectedGrades = [...selectedGrades, grade];
	}
}

function toggleType(type: string) {
	if (selectedTypes.includes(type)) {
		selectedTypes = selectedTypes.filter(t => t !== type);
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
        />
        
        <!-- Access filteredEvents as value, not function -->
        {#if currentView === 'calendar'}
          <CalendarView 
            events={filteredEvents}
            {currentMonth}
            {handleDateSelect}
            {selectedDate}
          />
        {:else}
          <ListView events={filteredEvents} />
        {/if}
      </div>
    </main>
  </div>
</div>

