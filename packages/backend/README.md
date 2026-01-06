# @kanaria/backend

This package contains the backend API server for the Kanaria application, built with Hono and deployed to Cloudflare Workers. It uses Drizzle ORM for database interactions with PostgreSQL (Supabase).

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Supabase project (for database)

### Development

To start the development server using Wrangler:

```bash
pnpm dev
```

The server will be available at `http://localhost:8787` by default.

### Scripts

- **`pnpm dev`**: Starts the local development server.
- **`pnpm deploy`**: Deploys the worker to Cloudflare.
- **`pnpm test`**: Runs unit tests using Vitest.
- **`pnpm lint`**: Runs Biome linting.
- **`pnpm drizzle:generate`**: Generates SQL migrations from schema.
- **`pnpm drizzle:migrate`**: Applies migrations to the database.

---

# @kanaria/backend

KanariaアプリケーションのバックエンドAPIサーバーパッケージです。Honoを使用して構築され、Cloudflare Workersにデプロイされます。データベース操作にはDrizzle ORMを使用し、PostgreSQL (Supabase) と接続します。

## はじめに (Getting Started)

### 前提条件 (Prerequisites)

- Node.js 22以上
- pnpm
- Supabaseプロジェクト (データベース用)

### 開発 (Development)

Wranglerを使用して開発サーバーを起動します：

```bash
pnpm dev
```

デフォルトで `http://localhost:8787` でサーバーが起動します。

### スクリプト (Scripts)

- **`pnpm dev`**: ローカル開発サーバーを起動します。
- **`pnpm deploy`**: Cloudflareにワーカーをデプロイします。
- **`pnpm test`**: Vitestを使用してユニットテストを実行します。
- **`pnpm lint`**: Biomeによるリンターを実行します。
- **`pnpm drizzle:generate`**: スキーマからSQLマイグレーションファイルを生成します。
- **`pnpm drizzle:migrate`**: データベースにマイグレーションを適用します。
