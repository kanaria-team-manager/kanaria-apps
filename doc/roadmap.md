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

## Phase 2: Data Fetching Optimization (Load Functions)
**目標**: データ取得（GET）を「コンポーネント内での非同期取得」から「Load関数による事前取得」に移行する。

- [ ] **Load関数の活用**: `onMount` や `$effect` で行っているデータ取得を、`+page.ts` または `+page.server.ts` の `load` 関数に移動する。
  - これにより、ページ表示時の「Loadingスピナー」を減らし、SSRによる高速な初期表示を実現する。
- [ ] **SvelteKit Fetchの適用**: `load` 関数内で `client.ts` のヘルパーを使用する際、引数として `fetch` (from LoadEvent) を渡す。
  - バックエンドへのCookie自動転送や内部APIの高速化などの恩恵を受ける。

## Phase 3: Mutation Logic Migration (Form Actions)
**目標**: データ更新（POST/PUT/DELETE）を「APIクライアントの直接呼び出し」から「Form Actions」に移行する。

- [ ] **Form Actionsへの移行**: `apiPost/apiPut` を使用しているイベントハンドラを、`<form method="POST" action="?/create">` 形式に書き換え、`+page.server.ts` の `actions` で処理する。
  - **対象候補**: ログイン、サインアップ、イベント作成・編集、ユーザー設定変更など。
- [ ] **バリデーションのサーバーサイド化**: バリデーションロジックをAction内に移動し、`fail()` 関数を使ってエラー時の入力を保持するUIへ移行する。

## Phase 4: Full BFF & Security Hardening (Optional / Long-term)
**目標**: クライアントからバックエンドへの直接アクセスを完全に遮断し、全ての通信をSvelteKitサーバー経由にする。

- [ ] **Proxy API Routes**: Form Actionsでカバーできない非同期通信（検索など）のために、SvelteKitのAPI Routes (`+server.ts`) をProxyとして用意する。
- [ ] **Cookie-based Auth**: アクセストークンをクライアントJS（local storage/memory）から完全に排除し、SvelteKitサーバーとのHttpOnly Cookieのみでセッション管理を行うように認証フローを再構築する。
