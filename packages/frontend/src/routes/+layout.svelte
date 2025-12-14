<script lang="ts">
import "./layout.css";
import "../app.css";
import favicon from "$lib/assets/favicon.svg";
import GlobalHeader from "$lib/components/GlobalHeader.svelte";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<GlobalHeader />

{@render children()}
