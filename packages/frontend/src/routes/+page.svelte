<script>
import { onMount } from "svelte";
import { goto } from "$app/navigation";

onMount(() => {
  goto("/auth/login");
});
</script>
  
  <div class="min-h-screen bg-background flex items-center justify-center">
    <p class="text-muted-foreground">リダイレクト中...</p>
  </div>
  