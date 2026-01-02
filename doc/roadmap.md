# SvelteKit アーキテクチャ強化ロードマップ

本ドキュメントでは、現在のSPAライクな実装（Client-Side Fetch中心）から、SvelteKitの機能を最大限に活用したアーキテクチャ（Server-Centric / BFFパターン）への移行計画を定義します。

## 目的
1.  **セキュリティ向上**: トークン管理をサーバーサイド（HttpOnly Cookie）に寄せ、XSSリスクを低減する。
2.  **堅牢性向上**: Progressive Enhancement（JS無効時の動作保証）を実現する。
3.  **パフォーマンスと整合性**: SSR時のデータ取得効率化と、バックエンドとの通信経路の統一。

---

## Phase 1: Authentication Logic Consolidation (現在実施中)
**目標**: フロントエンドのAPIリクエスト処理を `client.ts` に集約し、独自実装を排除する。

- [ ] **`client.ts` の拡張**: SvelteKit標準の `fetch` を注入可能にする（SSR/Load関数対応）。
- [ ] **`master.ts` のリファクタリング**: `fetchTags` などの独自fetch実装を廃止し、`client.ts` のヘルパー関数を利用するように書き換える。
- [ ] **呼び出し元の修正**: 各Page/Componentでの呼び出し時に `fetch` と `accessToken` を正しく渡すように修正する。

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
