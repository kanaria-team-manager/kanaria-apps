<script lang="ts">
import "./layout.css";
import "../app.css";
import { page } from "$app/state";
import favicon from "$lib/assets/favicon.svg";
import GlobalHeader from "$lib/components/GlobalHeader.svelte";

let { children } = $props();

// Header shown on these routes
const privateRoutes = ["/dashboard", "/players", "/places", "/event", "/events", "/user", "/tags"];
let shouldShowHeader = $derived(
  privateRoutes.some((route) => page.url.pathname.startsWith(route)),
);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shouldShowHeader}
<GlobalHeader />
{/if}

{@render children()}
