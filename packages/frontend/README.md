# @kanaria/frontend

This package contains the frontend web application for Kanaria, built with SvelteKit, Vite, and TailwindCSS.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm

### Development

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` by default.

### Scripts

- **`pnpm dev`**: Starts the local development server.
- **`pnpm build`**: Builds the application for production.
- **`pnpm preview`**: Previews the production build locally.
- **`pnpm check`**: Runs Svelte check for type safety.
- **`pnpm lint`**: Runs Biome linting.
- **`pnpm test`**: Runs unit tests (Vitest).

## Project Structure

- `src/routes`: SvelteKit file-based routing.
- `src/lib`: Shared components and logic.
- `src/lib/domains`: Domain-driven design structure for components and logic.

---

# @kanaria/frontend

KanariaのフロントエンドWebアプリケーションパッケージです。SvelteKit, Vite, TailwindCSSを使用して構築されています。

## はじめに (Getting Started)

### 前提条件 (Prerequisites)

- Node.js 22以上
- pnpm

### 開発 (Development)

開発サーバーを起動します以：

```bash
pnpm dev
```

デフォルトで `http://localhost:5173` でアプリケーションが起動します。

### スクリプト (Scripts)

- **`pnpm dev`**: ローカル開発サーバーを起動します。
- **`pnpm build`**: 本番用にアプリケーションをビルドします。
- **`pnpm preview`**: ビルドされたアプリケーションをローカルでプレビューします。
- **`pnpm check`**: Svelte checkを実行して型安全性を確認します。
- **`pnpm lint`**: Biomeによるリンターを実行します。
- **`pnpm test`**: ユニットテスト (Vitest) を実行します。

## プロジェクト構造 (Project Structure)

- `src/routes`: SvelteKitのファイルベースルーティング。
- `src/lib`: 共有コンポーネントとロジック。
- `src/lib/domains`: ドメイン駆動設計に基づいたコンポーネントとロジックの構造。
