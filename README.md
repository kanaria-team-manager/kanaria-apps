# Kanaria Workspace

This is a monorepo workspace for the Kanaria application, containing:
- **Frontend**: React + Vite + TypeScript (`packages/frontend`)
- **Backend**: Hono + TypeScript (`packages/backend`)

## Getting Started

### Prerequisites
- **Linux Users**: This project uses `flake.nix` to manage the development environment. Install Nix and run `direnv allow` or `nix develop` to set up the environment with Node.js, pnpm, and system dependencies for Playwright.
- **Node.js & pnpm**: Ensure you have Node.js 22+ and pnpm installed if not using Nix.

### Installation

Install dependencies from the workspace root:

```bash
pnpm install
```

### Running the Application

You can start both the frontend and backend simultaneously:

```bash
pnpm dev
```

Alternatively, run them in separate terminals:

```bash
# Terminal 1: Frontend (http://localhost:5173)
pnpm --filter frontend dev

# Terminal 2: Backend (http://localhost:8787)
pnpm --filter backend dev
```

## Testing with Playwright

Playwright is used for End-to-End (E2E) testing. The configuration automatically spins up the frontend and backend servers, so you don't need to start them manually before running tests.

### Setup Playwright

Install the required browser binaries:

```bash
pnpm playwright:install
```

### Run Tests

Run all E2E tests:

```bash
pnpm test:e2e
```


### Other Test Commands

- **UI Mode** (Interactive test runner):
  ```bash
  pnpm test:e2e:ui
  ```
- **Headed Mode** (Watch the browser run):
  ```bash
  pnpm test:e2e:headed
  ```
- **Debug Mode**:
  ```bash
  pnpm test:e2e:debug
  ```

## AI Code Review with CodeRabbit

This repository uses **CodeRabbit** for AI-based code reviews. It automatically reviews Pull Requests and provides feedback.

### Common Commands

You can interact with CodeRabbit by commenting on the PR:

- `@coderabbitai summary`: Generates a summary of the changes.
- `@coderabbitai review`: Triggers a full code review.
- `@coderabbitai resolve`: Resolves all CodeRabbit threads that have been addressed.
- `@coderabbitai help`: Shows all available commands.

---

# Kanaria ワークスペース

Kanariaアプリケーションのモノレポワークスペースです。以下のパッケージが含まれています：
- **フロントエンド (Frontend)**: React + Vite + TypeScript (`packages/frontend`)
- **バックエンド (Backend)**: Hono + TypeScript (`packages/backend`)

## はじめに (Getting Started)

### 前提条件 (Prerequisites)
- **Linuxユーザー**: このプロジェクトは `flake.nix` を使用して開発環境を管理しています。Nixをインストールし、`direnv allow` または `nix develop` を実行して、Node.js、pnpm、およびPlaywright用のシステム依存関係を含む環境をセットアップしてください。
- **Node.js & pnpm**: Nixを使用しない場合は、Node.js 22以上とpnpmがインストールされていることを確認してください。

### インストール (Installation)

ワークスペースのルートで依存関係をインストールします：

```bash
pnpm install
```

### アプリケーションの起動 (Running the Application)

フロントエンドとバックエンドを同時に起動できます：

```bash
pnpm dev
```

または、それぞれ別のターミナルで実行することも可能です：

```bash
# ターミナル 1: フロントエンド (http://localhost:5173)
pnpm --filter frontend dev

# ターミナル 2: バックエンド (http://localhost:8787)
pnpm --filter backend dev
```

## Playwrightによるテスト (Testing with Playwright)

E2EテストにはPlaywrightを使用しています。設定により、テスト実行時にフロントエンドとバックエンドのサーバーが自動的に起動するため、事前に手動でサーバーを立ち上げる必要はありません。

### Playwrightのセットアップ

必要なブラウザバイナリをインストールします：

```bash
pnpm playwright:install
```

### テストの実行

すべてのE2Eテストを実行します：

```bash
pnpm test:e2e
```

### その他のテストコマンド

- **UIモード** (インタラクティブなテストランナー):
  ```bash
  pnpm test:e2e:ui
  ```
- **Headedモード** (ブラウザの動作を目視確認):
  ```bash
  pnpm test:e2e:headed
  ```
- **デバッグモード**:
  ```bash
  pnpm test:e2e:debug
  ```

## CodeRabbitによるAIコードレビュー

このリポジトリでは、AIによるコードレビューツール **CodeRabbit** を導入しています。Pull Request作成時に自動的にレビューが行われます。

### 主なコマンド

PRへのコメントでCodeRabbitを操作できます：

- `@coderabbitai summary`: 変更の要約を生成します。
- `@coderabbitai review`: フルレビューを実行します。
- `@coderabbitai resolve`: 対応済みのCodeRabbitのスレッドをすべて解決します。
- `@coderabbitai help`: 利用可能なコマンド一覧を表示します。
