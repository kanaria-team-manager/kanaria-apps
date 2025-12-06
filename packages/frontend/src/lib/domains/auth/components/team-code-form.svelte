<script lang="ts">
  let { onVerified } = $props<{ onVerified: (team: any) => void }>();

  let teamCode = $state("");
  let error = $state("");
  let isLoading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!teamCode) {
      error = "チームコードを入力してください";
      return;
    }

    isLoading = true;
    error = "";

    try {
      // Use absolute URL for now or configure proxy. Assuming backend is on port 8787.
      // In a real app, this should be configured via env vars.
      const response = await fetch(
        `http://localhost:8787/teams/verify/${teamCode}`,
      );

      if (response.ok) {
        const data = await response.json();
        onVerified(data);
      } else if (response.status === 404) {
        error = "チームが見つかりませんでした";
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
  <div>
    <label for="teamCode" class="block text-sm font-medium text-foreground">
      チームコード
    </label>
    <div class="mt-1">
      <input
        id="teamCode"
        name="teamCode"
        type="text"
        bind:value={teamCode}
        required
        class="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background text-foreground"
        placeholder="チームコードを入力"
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
