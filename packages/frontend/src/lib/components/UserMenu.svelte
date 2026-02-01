<script lang="ts">
import { logout } from "$lib/domains/auth/logout";

let isOpen = $state(false);
let isLoggingOut = $state(false);

  let { direction = "down" }: { direction?: "up" | "down" } = $props();

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function closeMenu() {
    isOpen = false;
  }

  async function handleLogout() {
    isLoggingOut = true;
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      isLoggingOut = false;
      closeMenu();
    }
  }
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.user-menu')) {
    closeMenu();
  }
}} />

<div class="relative user-menu">
  <!-- User Avatar Button -->
  <button
    onclick={toggleMenu}
    class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    aria-label="ユーザーメニュー"
  >
    <svg 
      class="w-5 h-5 text-gray-600" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div 
      class="absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 {direction === 'up' ? 'bottom-full mb-2' : 'mt-2'}"
    >
      <!-- User -->
      <a
        href="/user"
        onclick={closeMenu}
        class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        ユーザー
      </a>

      <!-- Settings -->
      <a
        href="/user/settings"
        onclick={closeMenu}
        class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        設定
      </a>

      <!-- Divider -->
      <div class="border-t border-gray-200 my-1"></div>

      <!-- Logout -->
      <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {isLoggingOut ? "ログアウト中..." : "ログアウト"}
      </button>
    </div>
  {/if}
</div>
