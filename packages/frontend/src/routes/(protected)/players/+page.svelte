<script lang="ts">
import PlayerList from "$lib/domains/players/components/PlayerList.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <PlayerList initialPlayers={data.players} />
</div>
