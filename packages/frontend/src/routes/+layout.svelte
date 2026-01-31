<script lang="ts">
import "./layout.css";
import "../app.css";
import { page } from "$app/state";
import favicon from "$lib/assets/favicon.svg";
import Sidebar from "$lib/components/Sidebar.svelte";

let { children } = $props();

// Sidebar shown on these routes
const privateRoutes = ["/dashboard", "/players", "/places", "/event", "/events", "/user", "/tags", "/labels"];
let shouldShowSidebar = $derived(
  privateRoutes.some((route) => page.url.pathname.startsWith(route)),
);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shouldShowSidebar}
<Sidebar />
<div class="ml-64">
  {@render children()}
</div>
{:else}
{@render children()}
{/if}
