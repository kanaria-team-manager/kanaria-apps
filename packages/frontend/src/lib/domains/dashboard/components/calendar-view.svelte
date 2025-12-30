<script lang="ts">
import { goto } from "$app/navigation";
let {
  events,
  currentMonth,
  handleDateSelect,
  selectedDate,
  eventTypes = [],
} = $props();

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days = [];

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

function getEventsForDate(date: Date) {
  return events.filter(
    (event: { date: Date }) =>
      event.date.toDateString() === date.toDateString(),
  );
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

function isSelected(date: Date) {
  return selectedDate && date.toDateString() === selectedDate.toDateString();
}

const days = $derived(getDaysInMonth(currentMonth));
</script>

<div class="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
  <!-- Week days header -->
  <div class="grid grid-cols-7 bg-muted">
    {#each weekDays as day, i}
      <div class="
        py-3 text-center text-sm font-medium
        {i === 0 ? 'text-destructive' : i === 6 ? 'text-practice' : 'text-muted-foreground'}
      ">
        {day}
      </div>
    {/each}
  </div>

  <!-- Calendar grid -->
  <div class="grid grid-cols-7">
    {#each days as day, i}
      {@const dayEvents = getEventsForDate(day.date)}
      {@const dayOfWeek = day.date.getDay()}
      <div
        role="button"
        tabindex="0"
        onclick={() => handleDateSelect(day.date)}
        onkeydown={(e) => e.key === 'Enter' && handleDateSelect(day.date)}
        class="
          min-h-[100px] md:min-h-[120px] p-1 md:p-2 border-t border-r border-border
          transition-colors relative cursor-pointer
          {!day.isCurrentMonth ? 'bg-muted/50' : 'bg-card hover:bg-hover/50'}
          {isSelected(day.date) ? 'ring-2 ring-primary ring-inset' : ''}
          {i % 7 === 6 ? 'border-r-0' : ''}
        "
      >
        <div class="flex flex-col h-full">
          <span class="
            inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1
            {isToday(day.date) ? 'bg-primary text-primary-foreground font-bold' : ''}
            {!day.isCurrentMonth ? 'text-muted-foreground' : 
              dayOfWeek === 0 ? 'text-destructive' : 
              dayOfWeek === 6 ? 'text-practice' : 'text-foreground'}
          ">
            {day.date.getDate()}
          </span>
          
          <div class="flex-1 space-y-1 overflow-hidden">
            {#each dayEvents.slice(0, 3) as event}
              {@const typeInfo = eventTypes.find(t => t.id === event.type)}
              <button 
                onclick={(e) => {
                  e.stopPropagation();
                  goto(`/event/${event.eventNo}`);
                }}
                class="
                  w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium shadow-sm
                  {typeInfo ? typeInfo.color + ' text-white' : 'bg-gray-100 text-gray-800'}
                  hover:scale-[1.02] transition-transform
                "
              >
                <span class="hidden sm:inline">{event.title}</span>
                <span class="sm:hidden">{typeInfo ? typeInfo.label.charAt(0) : 'E'}</span>
              </button>
            {/each}
            {#if dayEvents.length > 3}
              <div class="text-xs text-muted-foreground px-1">
                +{dayEvents.length - 3}件
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Event Legend -->
<div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
  {#each eventTypes as type}
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full {type.color}"></span>
      <span class="text-muted-foreground">{type.label}</span>
    </div>
  {/each}
</div>
