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

let sidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if shouldShowSidebar}
<!-- Mobile header -->
<header class="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:hidden">
  <a href="/dashboard" class="font-bold text-lg text-primary">Kanaria</a>
  <button
    class="p-2 rounded-lg hover:bg-accent/50 transition-colors"
    onclick={() => sidebarOpen = true}
    aria-label="メニューを開く"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</header>

<Sidebar bind:open={sidebarOpen} />
<div class="mt-14 md:mt-0 md:ml-64">
  {@render children()}
</div>
{:else}
{@render children()}
{/if}
