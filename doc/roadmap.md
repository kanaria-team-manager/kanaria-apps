# SvelteKit アーキテクチャ強化ロードマップ

本ドキュメントでは、現在のSPAライクな実装（Client-Side Fetch中心）から、SvelteKitの機能を最大限に活用したアーキテクチャ（Server-Centric / BFFパターン）への移行計画を定義します。

## 目的
1.  **セキュリティ向上**: トークン管理をサーバーサイド（HttpOnly Cookie）に寄せ、XSSリスクを低減する。
2.  **堅牢性向上**: Progressive Enhancement（JS無効時の動作保証）を実現する。
3.  **パフォーマンスと整合性**: SSR時のデータ取得効率化と、バックエンドとの通信経路の統一。

---

## Phase 1: Authentication Logic Consolidation (現在実施中)
**目標**: フロントエンドのAPIリクエスト処理を `client.ts` に集約し、独自実装を排除する。バックエンドの認証要件を統一する。

### 1.1 フロントエンド修正 (完了)
- [x] **`client.ts` の拡張**: SvelteKit標準の `fetch` を注入可能にする（SSR/Load関数対応）。
- [x] **`master.ts` のリファクタリング**: `fetchTags` などの独自fetch実装を廃止し、`client.ts` のヘルパー関数を利用するように書き換える。

### 1.2 呼び出し元の修正 (完了)
- [x] `user/+page.svelte` - `fetchTags` に `accessToken` を渡すよう修正
- [x] `event/[eventNo]/edit/+page.svelte` - `fetchGradeTags` に `accessToken` を渡すよう修正
- [x] `events/create/+page.svelte` - `fetchGradeTags` に `accessToken` を渡すよう修正
- [x] `dashboard/+page.server.ts` - `fetchGradeTags` に `accessToken` を渡すよう修正
- [x] `players/[id]/edit/+page.svelte` - `fetchGradeTags` に `accessToken` を渡すよう修正
- [x] `lib/domains/players/components/PlayerList.svelte` - `fetchGradeTags` に `accessToken` を渡すよう修正
- [x] `lib/domains/players/components/player-create-modal.svelte` - `fetchGradeTags` に `accessToken` を渡すよう修正

### 1.3 バックエンド認証強化 (完了)
認証済みページ (`(protected)`) 配下から呼び出されるAPIは全て `authMiddleware` を必須とする。

**対象エンドポイント (現在公開、要保護化):**

| ファイル | エンドポイント | 対応 |
|---------|---------------|------|
| `tags/tags.ts` | `GET /tags/grade` | [x] authMiddleware追加 |
| `labels/labels.ts` | `GET /labels` | [x] 既にauthMiddleware適用済 |
| `attendance-statuses/attendance-statuses.ts` | `GET /attendance-statuses` | [x] 既にauthMiddleware適用済 |
| `events/events.ts` | `GET /events` | [x] 既にauthMiddleware適用済 |
| `events/events.ts` | `GET /events/:eventNo` | [x] 既にauthMiddleware適用済 |
| `places/places.ts` | `GET /places` | [x] 既にauthMiddleware適用済 |
| `places/places.ts` | `GET /places/:id` | [x] 既にauthMiddleware適用済 |
| `players/players.ts` | `GET /players` | [x] 既にauthMiddleware適用済 |
| `players/players.ts` | `GET /players/:id` | [x] 既にauthMiddleware適用済 |

**除外 (公開のまま維持):**
- `teams/verify.ts` - `GET /teams/verify/:code` (チームコード検証、未認証ユーザー向け)
- `teams/activate.ts` - `GET /teams/activate` (アカウント有効化、未認証ユーザー向け)

---

## Phase 2: Data Fetching Optimization (Load Functions) - 進行中
**目標**: データ取得（GET）を「コンポーネント内での非同期取得」から「Load関数による事前取得」に移行する。

**完了:**
- [x] `user/+page.svelte` - ユーザー設定
- [x] `players/[id]/+page.svelte` - プレイヤー詳細
- [x] `players/[id]/edit/+page.svelte` - プレイヤー編集
- [x] `event/[eventNo]/+page.svelte` - イベント詳細
- [x] `places/+page.svelte` - 場所一覧
- [x] `places/[id]/+page.svelte` - 場所詳細
- [x] `places/[id]/edit/+page.svelte` - 場所編集

**スキップ (複雑なインライン編集、Phase 3で対応予定):**
- [ ] `tags/+page.svelte` - タグ管理（インラインCRUD）
- [ ] `event/[eventNo]/edit/+page.svelte` - イベント編集
- [ ] `events/create/+page.svelte` - イベント作成

## Phase 3: Mutation Logic Migration (Form Actions) - 進行中
**目標**: データ更新（POST/PUT/DELETE）を「APIクライアントの直接呼び出し」から「Form Actions」に移行する。

**完了:**
- [x] `places/new` - 新規作成 (POST)
- [x] `places/[id]/edit` - 編集 (PUT)
- [x] `places` - 削除 (DELETE)
- [x] `players/[id]/edit` - 編集 (PUT)
- [x] `user` - プロフィール・タグ更新 (PUT)

**スキップ（複雑またはリアルタイム更新が必要）:**
- [ ] `event/[eventNo]/edit` - イベント編集（複数データソース）
- [ ] `events/create` - イベント作成（複数データソース）
- [ ] `tags` - インラインCRUD
- [ ] `event/[eventNo]` - 出席ステータス更新（リアルタイム更新）

## Phase 4: Full BFF & Security Hardening (Optional / Long-term)
**目標**: クライアントからバックエンドへの直接アクセスを完全に遮断し、全ての通信をSvelteKitサーバー経由にする。

- [ ] **Proxy API Routes**: Form Actionsでカバーできない非同期通信（検索など）のために、SvelteKitのAPI Routes (`+server.ts`) をProxyとして用意する。
- [ ] **Cookie-based Auth**: アクセストークンをクライアントJS（local storage/memory）から完全に排除し、SvelteKitサーバーとのHttpOnly Cookieのみでセッション管理を行うように認証フローを再構築する。
