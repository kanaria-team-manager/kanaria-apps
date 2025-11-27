<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    onMount(() => {
      goto('/login');
    });
  </script>
  
  <div class="min-h-screen bg-background flex items-center justify-center">
    <p class="text-muted-foreground">リダイレクト中...</p>
  </div>
  