<script lang="ts">
import type { Tag } from "@kanaria/shared";
import type { Session, User } from "@supabase/supabase-js";
import { enhance } from "$app/forms";

let { isOpen, onClose, onCreated, session, user, tags, users } = $props<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  session: Session;
  user: User | null;
  tags: Tag[];
  users: Array<{
    id: string;
    supabaseUserId: string;
    name: string;
    email: string;
    roleId: number | string;
  }>;
}>();

let lastName = $state("");
let firstName = $state("");
let nickName = $state("");
let selectedTagId = $state("");
let selectedParentId = $state("");
let isSubmitting = $state(false);
let error = $state("");
let currentUserRole = $state<number | null>(null);

const ROLE_OWNER = 0;
const ROLE_ADMIN = 1;

// Watch for open state
$effect(() => {
  if (isOpen) {
    lastName = "";
    firstName = "";
    nickName = "";
    selectedTagId = "";
    error = "";

    const currentUserId = user?.id;
    if (currentUserId) {
      const currentUser = users.find(
        (u: { supabaseUserId: string; roleId: string | number; id: string }) => u.supabaseUserId === currentUserId,
      );
      if (currentUser) {
        currentUserRole = Number(currentUser.roleId);
        selectedParentId = currentUser.id; // Default to self
      }
    }
  }
});



function handleClose() {
  if (!isSubmitting) onClose();
}
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
    <!-- Click outside to close -->
    <div 
      class="fixed inset-0" 
      onclick={handleClose} 
      onkeydown={(e) => e.key === 'Escape' && handleClose()}
      role="button"
      tabindex="0"
      aria-label="Close modal"
    ></div>
    
    <div class="relative bg-background rounded-lg shadow-xl w-full max-w-md my-8 flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-border flex justify-between items-center">
        <h2 class="text-xl font-bold text-foreground">選手を作成</h2>
        <button onclick={handleClose} class="text-muted-foreground hover:text-foreground" aria-label="閉じる">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto">
        <form 
          method="POST" 
          action="?/createPlayer"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ result, update }) => {
              isSubmitting = false;
              if (result.type === 'success') {
                onCreated();
                onClose();
              } else if (result.type === 'failure') {
                error = result.data?.error as string || "作成に失敗しました";
              }
              await update();
            };
          }}
          class="space-y-6"
        >
          <!-- Last Name -->
          <div>
              <label for="lastName" class="block text-sm font-medium text-foreground">姓 <span class="text-red-500">*</span></label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                bind:value={lastName}
                class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="山田"
                required
              />
            </div>

            <!-- First Name -->
            <div>
              <label for="firstName" class="block text-sm font-medium text-foreground">名 <span class="text-red-500">*</span></label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                bind:value={firstName}
                class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="太郎"
                required
              />
            </div>

            <!-- Nick Name -->
            <div>
              <label for="nickName" class="block text-sm font-medium text-foreground">ニックネーム</label>
              <input
                id="nickName"
                name="nickName"
                type="text"
                bind:value={nickName}
                class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="たろう"
              />
              <p class="mt-1 text-xs text-muted-foreground">ニックネームがあれば優先的に表示されます</p>
            </div>

            <!-- Grade Tag -->
            <div>
              <label for="grade" class="block text-sm font-medium text-foreground">学年 <span class="text-red-500">*</span></label>
              <select
                id="grade"
                name="tagId"
                bind:value={selectedTagId}
                class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="">選択してください</option>
                {#each tags as tag}
                  <option value={tag.id}>{tag.name}</option>
                {/each}
              </select>
            </div>

            <!-- Parent User (Only for Owner/Admin) -->
            {#if currentUserRole === ROLE_OWNER || currentUserRole === ROLE_ADMIN}
              <div>
                <label for="parent" class="block text-sm font-medium text-foreground">保護者</label>
                <select
                  id="parent"
                  name="parentUserId"
                  bind:value={selectedParentId}
                  class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                >
                  {#each users as user}
                    <option value={user.id}>{user.name} ({user.email})</option>
                  {/each}
                </select>
                <p class="mt-1 text-xs text-muted-foreground">オーナー・管理者は保護者を指定できます</p>
              </div>
            {/if}

            {#if error}
              <p class="text-sm text-red-600">{error}</p>
            {/if}

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onclick={handleClose}
                disabled={isSubmitting}
                class="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
              >
                {#if isSubmitting}
                  作成中...
                {:else}
                  作成
                {/if}
              </button>
            </div>
          </form>
      </div>
    </div>
  </div>
{/if}
