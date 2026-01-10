<script lang="ts">
import SignupForm from "$lib/domains/auth/components/signup-form.svelte";
import TeamOwnerSignupForm from "$lib/domains/auth/components/team-owner-signup-form.svelte";
import TeamCreationForm from "$lib/domains/auth/components/team-creation-form.svelte";

let isTeamInfoVerified = $state(false);
let verifiedInfo = $state<{ teamName: string; teamCode: string } | null>(null);

function handleTeamVerified(
  event: CustomEvent<{ teamName: string; teamCode: string }>,
) {
  verifiedInfo = event.detail;
  isTeamInfoVerified = true;
}
</script>
  
  <svelte:head>
	<title>チーム作成 | Kanaria</title>
  </svelte:head>
  
  <div class="min-h-screen bg-gradient-to-br from-background to-muted flex">
	<!-- Left Side: Form -->
	<div class="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
	  <div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8">
		  <h1 class="text-3xl font-bold text-foreground">チーム作成</h1>
		  <p class="text-muted-foreground mt-2">新しいチームを作成して、運営を始めましょう。</p>
		</div>
  
		<!-- Register Form Card -->
		<div class="bg-card rounded-lg shadow-lg border border-border p-8">
		  {#if !isTeamInfoVerified}
			<TeamCreationForm on:verified={handleTeamVerified} />
		  {:else}
			<div class="mb-6 p-4 bg-primary/10 rounded-md space-y-1">
			  <p class="text-sm text-primary font-medium">チーム名: {verifiedInfo?.teamName}</p>
			  <p class="text-sm text-muted-foreground">チームコード: {verifiedInfo?.teamCode}</p>
			</div>
            <div class="mb-4">
                <h2 class="text-lg font-semibold">管理者アカウント作成</h2>
                <p class="text-xs text-muted-foreground">チーム管理者のアカウントを作成します</p>
            </div>
			<TeamOwnerSignupForm teamName={verifiedInfo?.teamName} teamCode={verifiedInfo?.teamCode} />
		  {/if}
  
		  <!-- Login Link -->
		  <div class="mt-6 text-center text-sm">
			<span class="text-muted-foreground">すでにチームをお持ちですか？ </span>
			<a href="/auth/login" class="text-primary font-semibold hover:underline">ログイン</a>
		  </div>
		</div>
	  </div>
	</div>
  
	<!-- Right Side: Info Panel -->
	<div class="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12">
	  <div class="max-w-lg text-primary-foreground">
		<!-- Logo -->
		<div class="mb-8">
		  <div class="flex items-center gap-3">
			<div class="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
			  <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
				<circle cx="12" cy="12" r="5"/>
			  </svg>
			</div>
			<span class="text-3xl font-bold">Kanaria</span>
		  </div>
		</div>
  
		<!-- Features -->
		<h2 class="text-2xl font-bold mb-6">チーム運営をスマートに</h2>
		
		<ul class="space-y-4">
		  <li class="flex items-start gap-3">
			<div class="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5">
			  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
			  </svg>
			</div>
			<div>
			  <h3 class="font-semibold">チーム専用ページ</h3>
			  <p class="text-sm text-primary-foreground/80">作成したチーム専用のスペースで、メンバーと情報を共有できます。</p>
			</div>
		  </li>
		  <li class="flex items-start gap-3">
			<div class="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5">
			  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
			  </svg>
			</div>
			<div>
			  <h3 class="font-semibold">簡単メンバー招待</h3>
			  <p class="text-sm text-primary-foreground/80">チームコードを共有するだけで、保護者やコーチを簡単に招待できます。</p>
			</div>
		  </li>
		</ul>
  
	  </div>
	</div>
  </div>
