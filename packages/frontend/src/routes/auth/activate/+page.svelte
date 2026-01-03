<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { supabase } from "$lib/supabase";

let error = $state("");
let isActivating = $state(true);

const BACKEND_URL =
  import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:8787";

onMount(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      try {
        const response = await fetch(`${BACKEND_URL}/teams/activate`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          goto("/auth/login?activated=true");
        } else {
          const data = await response.json();
          error = data.error || "Activation failed";
        }
      } catch (e) {
        console.error("Fetch error:", e);
        error = "Communication error occurred";
      } finally {
        isActivating = false;
      }
    } else if (event === "SIGNED_OUT") {
    }
  });

  return () => {
    subscription.unsubscribe();
  };
});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 text-center">
    {#if isActivating}
      <div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">アカウントを有効化中...</h2>
        <div class="mt-4 flex justify-center">
          <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    {:else if error}
      <div>
        <h2 class="mt-6 text-3xl font-extrabold text-red-600">有効化に失敗しました</h2>
        <p class="mt-2 text-sm text-gray-600">{error}</p>
        <div class="mt-5">
          <a href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            ログインページへ戻る
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>
