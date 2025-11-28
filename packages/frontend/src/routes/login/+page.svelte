<script>
import LoginForm from "$lib/domains/auth/components/login-form.svelte";
import LoginHeader from "$lib/domains/auth/components/login-header.svelte";
</script>
  
<div class="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
    <div class="w-full max-w-md">
        <LoginHeader />

        <!-- Login Form Card -->
        <div class="bg-card rounded-lg shadow-lg border border-border p-8">
        <LoginForm />

        <!-- Sign Up Link -->
        <div class="mt-6 text-center text-sm">
            <span class="text-muted-foreground">アカウントをお持ちではありませんか？ </span>
            <a href="/signup" class="text-primary font-semibold hover:underline">新規登録</a>
        </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-muted-foreground">
        <p>コーチ、保護者、選手向けチーム管理プラットフォーム</p>
        </div>
    </div>
</div>
  