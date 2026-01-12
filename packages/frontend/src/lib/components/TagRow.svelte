<script lang="ts">
interface Label {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  systemFlag?: boolean;
  label?: Label | null;
}

let {
  tag,
  allLabels = [],
  presetColors,
  onUpdate,
  onDelete,
  onAddLabel,
  onRemoveLabel,
}: {
  tag: Tag;
  allLabels: Label[];
  presetColors: string[];
  onUpdate: (id: string, updates: { name?: string; color?: string }) => void;
  onDelete: (id: string) => void;
  onAddLabel: (tagId: string, labelId: string) => void;
  onRemoveLabel: (tagId: string, labelId: string) => void;
} = $props();

const isSystemTag = $derived(tag.systemFlag === true);
const tagLabel = $derived(tag.label || null);
const availableLabels = $derived(
  allLabels.filter(l => !tagLabel || l.id !== tagLabel.id)
);

let isEditingName = $state(false);
let isColorPickerOpen = $state(false);
let isLabelPickerOpen = $state(false);
let nameValue = $state(tag.name);

function handleNameSave() {
  if (isSystemTag) return;
  if (nameValue.trim() && nameValue !== tag.name) {
    onUpdate(tag.id, { name: nameValue.trim() });
  }
  isEditingName = false;
}

function handleColorSelect(color: string) {
  if (isSystemTag) return;
  onUpdate(tag.id, { color });
  isColorPickerOpen = false;
}

function handleLabelAdd(labelId: string) {
  if (isSystemTag) return;
  onAddLabel(tag.id, labelId);
  isLabelPickerOpen = false;
}

function handleLabelRemove(labelId: string) {
  if (isSystemTag) return;
  onRemoveLabel(tag.id, labelId);
}
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (isColorPickerOpen && !target.closest('.color-picker-container')) {
    isColorPickerOpen = false;
  }
  if (isLabelPickerOpen && !target.closest('.label-picker-container')) {
    isLabelPickerOpen = false;
  }
}} />

<div class="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors group {isSystemTag ? 'opacity-75' : ''}">
  <!-- Tag Name with Color indicator -->
  <div class="col-span-3 flex items-center gap-3">
    <span
      class="w-4 h-4 rounded-full flex-shrink-0 border border-border"
      style="background-color: {tag.color}"
    ></span>
    
    {#if isEditingName && !isSystemTag}
      <input
        type="text"
        bind:value={nameValue}
        onblur={handleNameSave}
        onkeydown={(e) => {
          if (e.key === "Enter") handleNameSave();
          if (e.key === "Escape") {
            nameValue = tag.name;
            isEditingName = false;
          }
        }}
        class="flex-1 px-2 py-1 border border-border rounded bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    {:else}
      <button
        onclick={() => { if (!isSystemTag) { isEditingName = true; nameValue = tag.name; } }}
        class="text-left font-medium transition-colors flex-1 min-w-0 truncate {isSystemTag ? 'cursor-default text-muted-foreground' : 'hover:text-foreground/80'}"
        disabled={isSystemTag}
      >
        {tag.name}
      </button>
    {/if}
    
    {#if isSystemTag}
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
        システム
      </span>
    {/if}
  </div>

  <!-- Color Picker -->
  <div class="col-span-2 relative color-picker-container">
    {#if isSystemTag}
      <div class="flex items-center gap-2">
        <span
          class="w-5 h-5 rounded border border-border"
          style="background-color: {tag.color}"
        ></span>
      </div>
    {:else}
      <button
        onclick={() => isColorPickerOpen = !isColorPickerOpen}
        class="flex items-center gap-2 px-2 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
        aria-label="色を変更"
      >
        <span
          class="w-5 h-5 rounded border border-border"
          style="background-color: {tag.color}"
        ></span>
      </button>
      
      {#if isColorPickerOpen}
        <div class="absolute top-full left-0 mt-2 p-2 bg-card border border-border rounded-lg shadow-lg z-10">
          <div class="grid grid-cols-4 gap-2">
            {#each presetColors as color}
              <button
                onclick={() => handleColorSelect(color)}
                class="w-8 h-8 rounded border-2 hover:scale-110 transition-transform {tag.color === color ? 'border-foreground' : 'border-border'}"
                style="background-color: {color}"
              >
                {#if tag.color === color}
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mx-auto text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Labels -->
  <div class="col-span-5 flex items-center gap-2 flex-wrap label-picker-container relative">
    {#if tagLabel}
      <span 
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
        style="background-color: {tagLabel.color}20; border-color: {tagLabel.color}; color: {tagLabel.color}"
      >
        {tagLabel.name}
        {#if !isSystemTag}
          <button
            onclick={() => handleLabelRemove(tagLabel.id)}
            class="hover:opacity-70 transition-opacity"
            aria-label="ラベルを削除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </span>
    {/if}
    
    {#if !isSystemTag}
      <button
        onclick={() => isLabelPickerOpen = !isLabelPickerOpen}
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {tagLabel ? '変更' : '追加'}
      </button>
      
      {#if isLabelPickerOpen && availableLabels.length > 0}
        <div class="absolute top-full left-0 mt-2 p-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-48">
          <div class="text-xs font-medium text-muted-foreground mb-2">ラベルを選択</div>
          <div class="space-y-1 max-h-48 overflow-y-auto">
            {#each availableLabels as label (label.id)}
              <button
                onclick={() => handleLabelAdd(label.id)}
                class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors text-left"
              >
                <span 
                  class="w-3 h-3 rounded-full border"
                  style="background-color: {label.color}"
                ></span>
                <span class="text-sm">{label.name}</span>
              </button>
            {/each}
          </div>
        </div>
      {:else if isLabelPickerOpen}
        <div class="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-10">
          <span class="text-xs text-muted-foreground">追加可能なラベルがありません</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Actions -->
  <div class="col-span-2 flex items-center justify-end">
    {#if !isSystemTag}
      <button
        onclick={() => onDelete(tag.id)}
        class="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-lg"
        aria-label="削除"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    {/if}
  </div>
</div>
