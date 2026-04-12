# UI Layout Rules

## 概要 (Overview)
フロントエンドページを実装する際は、デザインの見た目がコンテキストによってブレないように、一貫したテーマ変数によるクラス定義（TailwindCSS + カスタム変数）を使用してください。

## コンテナレイアウト (Container Layout)
基本的にページレイアウトは以下の構造を採用してください。

```svelte
<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- ページヘッダー -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">ページタイトル</h1>
        <p class="text-muted-foreground mt-1">ページの説明文</p>
      </div>
      <!-- アクションボタンが必要な場合はこの位置に配置 -->
    </div>
  </div>

  <!-- コンテンツ領域 -->
  <div class="rounded-lg border border-border bg-card">
    <div class="p-6">
       <!-- コンテンツ内容（フォームやリストなど） -->
    </div>
  </div>
</div>
```

## カラーとテーマ変数 (Colors & Theme Variables)
直接的なカラー（例：`bg-white`, `border-gray-200`, `text-gray-700`, `bg-indigo-600` など）は使用せず、`app.css`で定義されているセマンティックなトークンを使用してください。

### 背景とボーダー
- 主な背景: `bg-background`
- カード/パネルなどの背景: `bg-card`
- 境界線: `border-border`
- 無効化や強調用の薄い背景: `bg-muted`

### テキスト
- デフォルトのテキスト: `text-foreground`
- 補足や説明文など: `text-muted-foreground`
- スキームの反転テキスト（ボタンなどに乗せるテキスト）: `text-primary-foreground`

### フォーム要素 (Form Elements)
- ラベル (Label): `block text-sm font-medium text-muted-foreground`
- 入力欄 (Input/Textarea/Select):
  ```html
  <input class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
  ```
- 無効化された入力欄 (Disabled Input):
  フォームの基本クラスに加えて `bg-muted text-muted-foreground cursor-not-allowed` を追加

### ボタン要素 (Buttons)
- プライマリボタン (Primary):
  ```html
  <button class="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"></button>
  ```
- セカンダリ/キャンセルボタン (Secondary):
  ```html
  <button class="px-4 py-2 border border-border text-foreground font-medium rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"></button>
  ```
- 危険なアクション (Destructive):
  ```html
  <button class="text-destructive hover:text-destructive/80"></button>
  ```

## 共通コンポーネントインクルード (DRY Principle for Layouts)
画面の中で共通して利用されるコンポーネント（サイドバーレイアウトや、ヘッダーなど）は、個々のページ（`+page.svelte`や`+page.server.ts`）に直接インクルードせず、できる限り **SvelteKit の Layout Group (`(protected)/+layout.svelte` など)** に集約して継承する形をとってください。

例えば、管理系の画面でサイドバーやヘッダーを表示する必要がある場合、対象となる機能を `(protected)` などの共通レイアウト配下に置くことで、新しいページを追加した際も個別に `<Sidebar />` を呼び出す手間がなくなり、表示条件（配列にルーティングを追加するなど）をメンテナンスするコストも削減できます。
