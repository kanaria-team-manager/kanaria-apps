<script lang="ts">
import { page } from "$app/state";
import UserMenu from "$lib/components/UserMenu.svelte";

  const userName = $derived(page.data.user?.user_metadata?.name || page.data.user?.email || "");
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="flex h-14 items-center px-4 md:px-6">
    <div class="mr-4 hidden md:flex">
      <a href="/dashboard" class="mr-6 flex items-center space-x-2 font-bold">
        Kanaria
      </a>
      <nav class="flex items-center space-x-6 text-sm font-medium">
        <a 
          href="/dashboard"
          class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith('/dashboard') ? 'text-foreground' : 'text-foreground/60'}"
        >
          予定
        </a>
        <a 
          href="/players"
          class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith('/players') ? 'text-foreground' : 'text-foreground/60'}"
        >
          プレイヤー
        </a>
        <a 
          href="/places"
          class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith('/places') ? 'text-foreground' : 'text-foreground/60'}"
        >
          場所
        </a>
        <a 
          href="/tags"
          class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith('/tags') ? 'text-foreground' : 'text-foreground/60'}"
        >
          タグ
        </a>
      </nav>
    </div>

    <!-- Desktop User Menu -->
    <div class="hidden md:flex flex-1 justify-end items-center">
      {#if userName}
        <span class="mr-3 text-sm font-medium text-foreground">{userName}</span>
      {/if}
      <UserMenu />
    </div>

    <!-- Mobile Menu -->
    <div class="flex flex-1 items-center justify-between md:hidden">
      <a href="/dashboard" class="font-bold">Kanaria</a>
      <div class="flex items-center gap-4">
        <nav class="flex items-center gap-2 text-sm font-medium">
          <a 
            href="/dashboard"
            class="p-2 {page.url.pathname.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground'}"
          >
            予定
          </a>
          <a 
            href="/players"
            class="p-2 {page.url.pathname.startsWith('/players') ? 'text-primary' : 'text-muted-foreground'}"
          >
            プレイヤー
          </a>
          <a 
            href="/places"
            class="p-2 {page.url.pathname.startsWith('/places') ? 'text-primary' : 'text-muted-foreground'}"
          >
            場所
          </a>
          <a 
            href="/tags"
            class="p-2 {page.url.pathname.startsWith('/tags') ? 'text-primary' : 'text-muted-foreground'}"
          >
            タグ
          </a>
        </nav>
        <UserMenu />
      </div>
    </div>
  </div>
</header>
