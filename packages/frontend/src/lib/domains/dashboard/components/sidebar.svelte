<script>
  let { 
    open = $bindable(), 
    grades, 
    eventTypes, 
    selectedGrades, 
    selectedTypes, 
    toggleGrade, 
    toggleType,
    clearFilters 
  } = $props();
</script>

<!-- Overlay for mobile -->
{#if open}
  <div 
    class="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
    role="button"
    tabindex="0"
    aria-label="Close sidebar"
    onclick={() => open = false}
    onkeydown={(e) => e.key === 'Enter' && (open = false)}
  ></div>
{/if}

<aside class="
  fixed lg:sticky top-0 left-0 z-50 lg:z-0
  w-72 h-screen lg:h-[calc(100vh-61px)]
  bg-card border-r border-border
  transform transition-transform duration-300 ease-in-out
  {open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  overflow-y-auto
">
  <div class="p-4 lg:pt-6">
    <div class="flex items-center justify-between mb-6 lg:hidden">
      <h2 class="font-semibold text-foreground">フィルター</h2>
      <button onclick={() => open = false} class="p-1 rounded hover:bg-hover" aria-label="Close sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Grade Filter -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        学年
      </h3>
      <div class="flex flex-wrap gap-2">
        {#each grades as grade}
          <button
            aria-label={`Toggle grade ${grade}`}
            onclick={() => toggleGrade(grade)}
            class="
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              {selectedGrades.includes(grade) 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-secondary text-secondary-foreground hover:bg-hover'}
            "
          >
            {grade}
          </button>
        {/each}
      </div>
    </div>

    <!-- Event Type Filter -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        種類
      </h3>
      <div class="space-y-2">
        {#each eventTypes as type}
          <button
            aria-label={`Toggle event type ${type.label}`}
            onclick={() => toggleType(type.id)}
            class="
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              {selectedTypes.includes(type.id) 
                ? 'bg-accent ring-2 ring-primary' 
                : 'hover:bg-hover'}
            "
          >
            <span class="
              w-3 h-3 rounded-full
              {type.id === 'match' ? 'bg-match' : type.id === 'practice' ? 'bg-practice' : 'bg-event'}
            "></span>
            <span class="text-sm text-foreground">{type.label}</span>
            {#if selectedTypes.includes(type.id)}
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Clear Filters -->
    {#if selectedGrades.length > 0 || selectedTypes.length > 0}
      <button
        onclick={clearFilters}
        class="w-full py-2 px-4 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2"
        aria-label="Clear filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        フィルターをクリア
      </button>
    {/if}

    <!-- Quick Stats -->
    <div class="mt-8 p-4 bg-muted rounded-xl">
      <h3 class="text-sm font-semibold text-foreground mb-3">今月の予定</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-match"></span>
            <span class="text-sm text-muted-foreground">試合</span>
          </div>
          <span class="text-sm font-medium text-foreground">4件</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-practice"></span>
            <span class="text-sm text-muted-foreground">練習</span>
          </div>
          <span class="text-sm font-medium text-foreground">4件</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-event"></span>
            <span class="text-sm text-muted-foreground">イベント</span>
          </div>
          <span class="text-sm font-medium text-foreground">2件</span>
        </div>
      </div>
    </div>
  </div>
</aside>
