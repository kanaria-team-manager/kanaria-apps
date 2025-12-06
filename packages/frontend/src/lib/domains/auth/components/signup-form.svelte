<script lang="ts">
import { goto } from "$app/navigation";
import type { SignupCredentials } from "$lib/domains/auth/types";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from "$lib/domains/auth/validators";
import { supabase } from "$lib/supabase";

let { teamName, teamCode } = $props<{ teamName?: string; teamCode?: string }>();

let name = $state("");
let email = $state("");
let password = $state("");
let passwordConfirm = $state("");
let isLoading = $state(false);
let error = $state("");

const BACKEND_URL =
  import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:8787";

async function handleRegister(e: Event) {
  e.preventDefault();
  error = "";

  const nameError = validateName(name);
  if (nameError) {
    error = nameError;
    return;
  }

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

  const confirmError = validatePasswordConfirm(password, passwordConfirm);
  if (confirmError) {
    error = confirmError;
    return;
  }

  if (!teamName || !teamCode) {
    error = "チーム情報が不足しています。最初からやり直してください。";
    return;
  }

  isLoading = true;

  try {
    // 1. Supabase Auth SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("ユーザー作成に失敗しました");

    // 2. Backend Team Creation
    const response = await fetch(`${BACKEND_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        supabaseUserId: authData.user.id,
        teamName,
        teamCode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Orphan User Handling: User is created in Supabase but Team creation failed.
      // Ideally we should rollback Supabase user or show a specific error to contact support / retry.
      console.error("Team creation failed:", errorText);
      throw new Error(
        "チームの作成に失敗しました。時間をおいて再試行してください。",
      );
    }

    // Success
    goto("/auth/verify-email");
  } catch (err) {
    error = err instanceof Error ? err.message : "登録に失敗しました";
  } finally {
    isLoading = false;
  }
}
</script>
  
  <form onsubmit={handleRegister} class="space-y-4">
	{#if error}
	  <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
		{error}
	  </div>
	{/if}
  
	<!-- Name Input -->
	<div class="space-y-2">
	  <label for="name" class="block text-sm font-medium text-foreground">
		お名前
	  </label>
	  <input
		id="name"
		type="text"
		placeholder="山田 太郎"
		bind:value={name}
		required
		disabled={isLoading}
		class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
	  />
	</div>
  
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
  
	<!-- Role Selection -->
	<fieldset class="space-y-2">
	  <legend class="block text-sm font-medium text-foreground">
		ご利用目的
	  </legend>
	</fieldset>
  
	<!-- Password Input -->
	<div class="space-y-2">
	  <label for="password" class="block text-sm font-medium text-foreground">
		パスワード
	  </label>
	  <input
		id="password"
		type="password"
		placeholder="8文字以上"
		bind:value={password}
		required
		disabled={isLoading}
		class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
	  />
	</div>
  
	<!-- Password Confirm Input -->
	<div class="space-y-2">
	  <label for="passwordConfirm" class="block text-sm font-medium text-foreground">
		パスワード（確認）
	  </label>
	  <input
		id="passwordConfirm"
		type="password"
		placeholder="パスワードを再入力"
		bind:value={passwordConfirm}
		required
		disabled={isLoading}
		class="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
	  />
	</div>
  
	<!-- Register Button -->
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
		  登録中...
		</span>
	  {:else}
		アカウントを作成
	  {/if}
	</button>
  
	<!-- Terms -->
	<p class="text-xs text-muted-foreground text-center">
	  登録することで、<a href="/terms" class="text-primary hover:underline">利用規約</a>と<a href="/privacy" class="text-primary hover:underline">プライバシーポリシー</a>に同意したものとみなされます。
	</p>
  </form>
  