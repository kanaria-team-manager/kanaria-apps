<script lang="ts">
import { page } from "$app/stores";
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="container flex h-14 items-center px-4 md:px-6">
    <div class="mr-4 hidden md:flex">
      <a href="/dashboard" class="mr-6 flex items-center space-x-2 font-bold">
        Kanaria
      </a>
      <nav class="flex items-center space-x-6 text-sm font-medium">
        <a 
          href="/dashboard"
          class="transition-colors hover:text-foreground/80 {$page.url.pathname.startsWith('/dashboard') ? 'text-foreground' : 'text-foreground/60'}"
        >
          予定
        </a>
        <a 
          href="/players"
          class="transition-colors hover:text-foreground/80 {$page.url.pathname.startsWith('/players') ? 'text-foreground' : 'text-foreground/60'}"
        >
          プレイヤー
        </a>
      </nav>
    </div>

    <!-- Mobile Menu (Simple version for now) -->
    <div class="flex flex-1 items-center justify-between md:hidden">
      <a href="/dashboard" class="font-bold">Kanaria</a>
      <nav class="flex items-center gap-4 text-sm font-medium">
        <a 
          href="/dashboard"
          class="p-2 {$page.url.pathname.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground'}"
        >
          予定
        </a>
        <a 
          href="/players"
          class="p-2 {$page.url.pathname.startsWith('/players') ? 'text-primary' : 'text-muted-foreground'}"
        >
          プレイヤー
        </a>
      </nav>
    </div>
  </div>
</header>
