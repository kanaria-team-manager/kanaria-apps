<script lang="ts">
import { goto } from "$app/navigation";
import { login } from "$lib/domains/auth/login.js";
import type { LoginCredentials } from "$lib/domains/auth/types";
import { validateEmail, validatePassword } from "$lib/domains/auth/validators";

let email = $state("");
let password = $state("");
let isLoading = $state(false);
let error = $state("");

async function handleLogin(e: Event) {
  e.preventDefault();
  error = "";

  // Validate inputs
  const emailError = validateEmail(email);
  if (emailError) {
    error = emailError;
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    error = passwordError;
    return;
  }

  isLoading = true;

  try {
    const credentials: LoginCredentials = { email, password };
    await login(credentials);

    // ログイン情報をsessionStorageに保存
    sessionStorage.setItem("loginEmail", email);
    sessionStorage.setItem("loginPassword", password);

    // ダッシュボードへ遷移
    goto("/dashboard");
  } catch (err) {
    error = err instanceof Error ? err.message : "ログインに失敗しました";
  } finally {
    isLoading = false;
  }
}

async function gotoCreateTeam() {
  goto("/create-team");
}

async function gotoSignup() {
  goto("/signup");
}
</script>
  
  <form onsubmit={handleLogin} class="space-y-5">
    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    {/if}
  
    <!-- Email Input -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-foreground">
        メールアドレス
      </label>
      <input
        id="email"
        type="email"
        placeholder="your@email.com"
        bind:value={email}
        required
        disabled={isLoading}
        class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  
    <!-- Password Input -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label for="password" class="block text-sm font-medium text-foreground">
          パスワード
        </label>
        <a href="/forgot-password" class="text-xs text-primary hover:underline">
          忘れた方
        </a>
      </div>
      <input
        id="password"
        type="password"
        placeholder="••••••••"
        bind:value={password}
        required
        disabled={isLoading}
        class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  
    <!-- Login Button -->
    <button
      type="submit"
      disabled={isLoading}
      class="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ログイン中...
        </span>
      {:else}
        ログイン
      {/if}
    </button>
  
    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-border"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-card text-muted-foreground">または</span>
      </div>
    </div>

    <!-- Sign Up Link -->
    <div class="space-y-2">
      <button
        type="button"
        disabled={isLoading}
        onclick={() => gotoCreateTeam()}
        class="w-full px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
      新しくチームを作る
      </button>
      <button
        type="button"
        disabled={isLoading}
        onclick={() => gotoSignup()}
        class="w-full px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
      チームに参加する
      </button>
  </div>
  </form>
  