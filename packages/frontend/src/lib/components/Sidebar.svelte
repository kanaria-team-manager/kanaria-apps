<script lang="ts">
import { page } from "$app/state";
import UserMenu from "$lib/components/UserMenu.svelte";

const userName = $derived(page.data.user?.user_metadata?.name || page.data.user?.email || "");

// Navigation items
const navItems = [
  { href: "/dashboard", label: "予定", icon: "calendar" as const },
  { href: "/players", label: "プレイヤー", icon: "users" as const },
  { href: "/places", label: "場所", icon: "map-pin" as const },
  { href: "/tags", label: "タグ", icon: "tag" as const },
  { href: "/labels", label: "ラベル", icon: "bookmark" as const },
  { href: "/users", label: "ユーザー", icon: "user-circle" as const },
];

type IconKey = typeof navItems[number]["icon"];

// SVG icons
const icons: Record<IconKey, string> = {
  calendar: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
  users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
  "map-pin": '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />',
  tag: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />',
  bookmark: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />',
  "user-circle": '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
};
</script>

<aside class="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="flex h-full flex-col">
    <!-- Logo / Header with User Menu -->
    <div class="flex h-14 items-center justify-between border-b px-4">
      <a href="/dashboard" class="flex items-center space-x-2 font-bold text-lg">
        <span class="text-primary">Kanaria</span>
      </a>
      <UserMenu />
    </div>

    <!-- User info below header -->
    {#if userName}
      <div class="border-b px-4 py-3">
        <p class="truncate text-sm font-medium text-muted-foreground">{userName}</p>
      </div>
    {/if}

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {#each navItems as item}
        {@const isActive = page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          class="
            flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
            {isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {@html icons[item.icon]}
          </svg>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </div>
</aside>
