<script lang="ts">
import { invalidateAll } from "$app/navigation";
import PlayerList from "$lib/domains/players/components/PlayerList.svelte";
import PlayerCreateModal from "$lib/domains/players/components/player-create-modal.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

let isCreateModalOpen = $state(false);

function handleCreate() {
  isCreateModalOpen = true;
}

function handleCreated() {
  invalidateAll();
}
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <!-- PlayerList usually has its own header/controls, but adding a page level header for the button -->
    <!-- If PlayerList has a header, we might want to integrate the button there, but for now putting it above -->
    <div class="flex-1"></div> <!-- Spacer if needed -->
    <button
      onclick={handleCreate}
      class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm"
    >
      選手を作成
    </button>
  </div>

  <PlayerList initialPlayers={data.players} session={data.session} />

  <PlayerCreateModal
    isOpen={isCreateModalOpen}
    onClose={() => isCreateModalOpen = false}
    onCreated={handleCreated}
    session={data.session}
    user={data.user}
  />
</div>
