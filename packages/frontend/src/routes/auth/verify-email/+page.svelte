<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let email = $state("");

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      email = user.email;
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 text-center">
    <div>
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900">メールを確認してください</h2>
      <p class="mt-2 text-sm text-gray-600">
        {#if email}
          <span class="font-medium text-indigo-600">{email}</span> 宛に確認メールを送信しました。<br>
        {:else}
          登録されたメールアドレスに確認メールを送信しました。<br>
        {/if}
        メール内のリンクをクリックして、登録を完了してください。
      </p>
    </div>
    <div class="mt-5">
      <button
        onclick={() => goto('/login')}
        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        ログインページへ
      </button>
    </div>
  </div>
</div>
