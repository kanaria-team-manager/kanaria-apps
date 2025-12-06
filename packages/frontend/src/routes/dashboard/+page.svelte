<script lang="ts">
import { goto } from "$app/navigation";
import { supabase } from "$lib/supabase";
import { onMount } from "svelte";

let email = $state("");
let userId = $state("");

onMount(async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    goto("/login");
    return;
  }

  email = user.email || "";
  userId = user.id;
});
</script>

<div class="min-h-screen bg-background p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold text-foreground mb-8">ダッシュボード</h1>

		<div class="bg-card rounded-lg shadow-lg border border-border p-6">
			<h2 class="text-xl font-semibold text-foreground mb-4">
				ログイン情報
			</h2>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-muted-foreground mb-1">
						メールアドレス
					</label>
					<p class="text-foreground">{email || "（未設定）"}</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-muted-foreground mb-1">
						ユーザーID
					</label>
					<p class="text-foreground">{userId || "（未設定）"}</p>
				</div>
			</div>
		</div>
	</div>
</div>

