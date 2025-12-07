<script>
  let { 
    currentView = $bindable(), 
    currentMonth = $bindable(),
    selectedGrades,
    selectedTypes,
    selectedDate,
    clearFilters
  } = $props();

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  function prevMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }

  function goToToday() {
    currentMonth = new Date();
  }

  const hasActiveFilters = $derived(selectedGrades.length > 0 || selectedTypes.length > 0 || selectedDate);
</script>

<div class="mb-6">
  <!-- View Toggle and Month Navigation -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
    <div class="flex items-center gap-2">
      <button onclick={prevMonth} class="p-2 rounded-lg hover:bg-hover transition-colors" aria-label="Previous Month">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-xl font-bold text-foreground min-w-[140px] text-center">
        {currentMonth.getFullYear()}年 {months[currentMonth.getMonth()]}
      </h2>
      <button onclick={nextMonth} class="p-2 rounded-lg hover:bg-hover transition-colors" aria-label="Next Month">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button 
        onclick={goToToday}
        class="ml-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-hover transition-colors"
        aria-label="Go to Today"
      >
        今日
      </button>
    </div>

    <div class="flex items-center gap-2">
      <!-- View Toggle -->
      <div class="flex bg-secondary rounded-lg p-1">
        <button
          onclick={() => currentView = 'calendar'}
          class="
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            {currentView === 'calendar' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'}
          "
          aria-label="Calendar View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="hidden sm:inline">カレンダー</span>
        </button>
        <button
          onclick={() => currentView = 'list'}
          class="
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            {currentView === 'list' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'}
          "
          aria-label="List View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span class="hidden sm:inline">リスト</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Active Filters Display -->
  {#if hasActiveFilters}
    <div class="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
      <span class="text-sm text-muted-foreground">絞り込み:</span>
      {#each selectedGrades as grade}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {grade}
        </span>
      {/each}
      {#each selectedTypes as type}
        <span class="
          inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
          {type === 'match' ? 'bg-match/10 text-match' : type === 'practice' ? 'bg-practice/10 text-practice' : 'bg-event/10 text-event'}
        ">
          {type === 'match' ? '試合' : type === 'practice' ? '練習' : 'イベント'}
        </span>
      {/each}
      {#if selectedDate}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
          {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
        </span>
      {/if}
      <button
        onclick={clearFilters}
        class="ml-auto text-xs text-destructive hover:underline"
        aria-label="Clear Filters"
      >
        クリア
      </button>
    </div>
  {/if}
</div>
