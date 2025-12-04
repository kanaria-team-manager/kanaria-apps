<script lang="ts">
import { createEventDispatcher } from "svelte";

const dispatch = createEventDispatcher();

let teamName = $state("");
let teamCode = $state("");
let error = $state("");
let isLoading = $state(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!teamName || !teamCode) {
    error = "チーム名とチームコードを入力してください";
    return;
  }

  isLoading = true;
  error = "";

  try {
    // Check if team code is available (should return 404)
    const response = await fetch(
      `http://localhost:8787/teams/verify/${teamCode}`,
    );

    if (response.status === 404) {
      // Code is available!
      dispatch("verified", { teamName, teamCode });
    } else if (response.ok) {
      // Code is taken (200 OK means it exists)
      error = "このチームコードは既に使用されています";
    } else {
      error = "エラーが発生しました。もう一度お試しください。";
    }
  } catch (e) {
    error = "通信エラーが発生しました";
    console.error(e);
  } finally {
    isLoading = false;
  }
}
</script>
  
<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Team Name -->
  <div>
    <label for="teamName" class="block text-sm font-medium text-foreground">
      チーム名
    </label>
    <div class="mt-1">
      <input
        id="teamName"
        name="teamName"
        type="text"
        bind:value={teamName}
        required
        class="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
        placeholder="例: カナリアFC"
        disabled={isLoading}
      />
    </div>
  </div>

  <!-- Team Code -->
  <div>
    <div class="flex items-center gap-2">
      <label for="teamCode" class="block text-sm font-medium text-foreground">
        チームコード
      </label>
      <button 
        type="button"
        class="group relative flex items-center focus:outline-none"
        onclick={() => {
          // Only show alert on devices that don't support hover (e.g. mobile)
          if (!window.matchMedia('(hover: hover)').matches) {
            alert('チームに保護者等を招待するために使用するコードです。');
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground cursor-help">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <path d="M12 17h.01"></path>
        </svg>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg border border-gray-900 z-10 text-center pointer-events-none">
          チームに保護者等を招待するために使用するコードです。
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    </div>
    <div class="mt-1">
      <input
        id="teamCode"
        name="teamCode"
        type="text"
        bind:value={teamCode}
        required
        class="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
        placeholder="半角英数字 (例: kanaria2025)"
        disabled={isLoading}
      />
    </div>
    {#if error}
      <p class="mt-2 text-sm text-red-600">{error}</p>
    {/if}
  </div>
  
  <div>
    <button
      type="submit"
      disabled={isLoading}
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        確認中...
      {:else}
        次へ
      {/if}
    </button>
  </div>
</form>
