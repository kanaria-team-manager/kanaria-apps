<script lang="ts">
import SignupForm from "$lib/domains/auth/components/signup-form.svelte";
import TeamCodeForm from "$lib/domains/auth/components/team-code-form.svelte";

interface Team {
  id: string;
  name: string;
  code: string;
}

let isTeamVerified = $state(false);
let verifiedTeam = $state<Team | null>(null);

function handleTeamVerified(team: Team) {
  verifiedTeam = team;
  isTeamVerified = true;
}
</script>

<svelte:head>
  <title>チームに参加する | Kanaria</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-background to-muted flex">
  <!-- Left Side: Form -->
  <div class="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-foreground">チームに参加する</h1>
        <p class="text-muted-foreground mt-2">
          Kanariaで、チーム運営をもっと簡単に。
        </p>
      </div>

      <!-- Register Form Card -->
      <div class="bg-card rounded-lg shadow-lg border border-border p-8">
        {#if !isTeamVerified}
          <TeamCodeForm onVerified={handleTeamVerified} />
        {:else}
          <div class="mb-6 p-4 bg-primary/10 rounded-md">
            <p class="text-sm text-primary font-medium">
              チーム: {verifiedTeam?.name}
            </p>
          </div>
          <SignupForm teamId={verifiedTeam?.id} teamCode={verifiedTeam?.code} />
        {/if}

        <!-- Login Link -->
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground"
            >すでにアカウントをお持ちですか？
          </span>
          <a href="/auth/login" class="text-primary font-semibold hover:underline"
            >ログイン</a
          >
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
          <div
            class="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center"
          >
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
          <span class="text-3xl font-bold">Kanaria</span>
        </div>
      </div>

      <!-- Features -->
      <h2 class="text-2xl font-bold mb-6">
        少年少女サッカーチームの運営をサポート
      </h2>

      <ul class="space-y-4">
        <li class="flex items-start gap-3">
          <div
            class="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">スケジュール管理</h3>
            <p class="text-sm text-primary-foreground/80">
              練習・試合の予定を簡単に共有。出欠確認も楽々！
            </p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div
            class="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">連絡機能</h3>
            <p class="text-sm text-primary-foreground/80">
              コーチから保護者への連絡がスムーズに。既読確認も可能。
            </p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div
            class="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">選手管理</h3>
            <p class="text-sm text-primary-foreground/80">
              選手情報を一元管理。成長記録や出席率も把握できます。
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</div>
