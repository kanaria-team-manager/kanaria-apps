<script lang="ts">
import { apiPost } from "$lib/api/client";
import { fetchGradeTags } from "$lib/api/master";
import { fetchUsers, type TeamUser } from "$lib/api/users";
import type { Tag } from "@kanaria/shared";
import type { Session, User } from "@supabase/supabase-js";
import { onMount } from "svelte";

let { isOpen, onClose, onCreated, session, user } = $props<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  session: Session;
  user: User | null;
}>();

let name = $state("");
let selectedTagId = $state("");
let selectedParentId = $state("");
let tags = $state<Tag[]>([]);
let users = $state<TeamUser[]>([]);
let isLoading = $state(false);
let isSubmitting = $state(false);
let error = $state("");
let currentUserRole = $state<number | null>(null);

const ROLE_OWNER = 0;
const ROLE_ADMIN = 1;

// Watch for open state
$effect(() => {
  if (isOpen) {
    loadData();
    // Default form reset
    name = "";
    selectedTagId = "";
    error = "";
    // selectedParentId will be set after loading users
  }
});

async function loadData() {
  isLoading = true;
  error = "";
  try {
    const [tagsData, usersData] = await Promise.all([
      fetchGradeTags(window.fetch),
      fetchUsers(session.access_token),
    ]);
    tags = tagsData;
    users = usersData;

    // Find current user role
    const currentUserId = user?.id;

    if (currentUserId) {
      const currentUser = users.find(
        (u) => u.supabaseUserId === currentUserId,
      );
      if (currentUser) {
        currentUserRole = Number(currentUser.roleId);
        selectedParentId = currentUser.id; // Default to self
      } else {
        console.warn("[Debug] Current user not found in users list");
      }
    }
  } catch (e) {
    console.error(e);
    error = "データの読み込みに失敗しました";
  } finally {
    isLoading = false;
  }
}


async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!name || !selectedTagId) {
    error = "必須項目を入力してください";
    return;
  }

  isSubmitting = true;
  error = "";

  try {
    await apiPost(
      "/players",
      {
        name,
        tagId: selectedTagId,
        parentUserId: selectedParentId,
      },
      session.access_token,
    );
    onCreated();
    onClose();
  } catch (e) {
    console.error(e);
    error = "選手作成に失敗しました";
  } finally {
    isSubmitting = false;
  }
}

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
        {#if isLoading}
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        {:else}
          <form onsubmit={handleSubmit} class="space-y-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-foreground">名前 <span class="text-red-500">*</span></label>
              <input
                id="name"
                type="text"
                bind:value={name}
                class="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="選手名を入力"
                required
              />
            </div>

            <!-- Grade Tag -->
            <div>
              <label for="grade" class="block text-sm font-medium text-foreground">学年 <span class="text-red-500">*</span></label>
              <select
                id="grade"
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
        {/if}
      </div>
    </div>
  </div>
{/if}
