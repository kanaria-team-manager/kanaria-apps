### 最終決定スタック（2025年11月時点）

| レイヤー              | 選択技術                                   | 理由・ポイント                                                                                 |
|-----------------------|--------------------------------------------|------------------------------------------------------------------------------------------------|
| **Frontend**          | SvelteKit（Svelte 5） + Tailwind CSS       | 開発体験・実行時パフォーマンス最強。shadcn-svelteも使える。                                      |
| **Backend API**       | Hono（Cloudflare Workersネイティブ）       | 超軽量、TypeScriptネイティブ、Workersサイズ制限に最適。                                         |
| **認証（Auth）**      | Supabase Auth                              | Web・将来的なスマホアプリ（React Native / Flutter）で完全共有可能。RLSと直結。                  |
| **データベース**      | Supabase PostgreSQL                        | サーバーレスPostgres、リアルタイム、RLS、無料枠十分、将来的にスマホアプリと完全共用。           |
| **ORM / クエリ**      | Drizzle ORM（TypeScript型安全）            | Supabase + Hono + SvelteKitで型共有が最高に楽。マイグレーションも簡単。                          |
| **モノレポ管理**      | pnpm workspaces                            | 高速・ディスク節約。frontend / backend / shared の3パッケージ構成。                             |
| **デプロイ（フロント）** | Cloudflare Pages + Functions              | Gitプッシュで自動デプロイ。静的資産はCDN、軽い動的処理はFunctionsで。                           |
| **デプロイ（バックエンド）** | Cloudflare Workers                     | Hono APIをエッジ実行。グローバル低レイテンシ。                                                 |
| **ストレージ（選手写真など）** | Cloudflare R2                       | S3互換、ゼロイグレス料金、Workers/Pagesから直接バインド可能。                                   |
| **その他ツール**      | TypeScript、shadcn-svelte（UI）、Lucide Icons | 全部Svelte 5 + Tailwindと完璧に相性良し。                                                     |

#### パッケージ構成（pnpm workspaces）
```
soccer-team-app/
├── packages/
│   ├── frontend/      → SvelteKit + Tailwind + Supabase Auth
│   ├── backend/       → Hono + Drizzle + Supabase client
│   └── shared/        → Drizzleスキーマ、型定義、共通utils
├── pnpm-workspace.yaml
└── package.json
```

#### コスト概算（個人開発〜中規模運用）
| サービス         | プラン   | 月額目安         | 備考                              |
|------------------|----------|------------------|-----------------------------------|
| Supabase         | Free → Pro | $0 → $25         | 無料で十分スタート、成長したらPro |
| Cloudflare Pages/Workers | Free    | $0               | 無制限リクエストまで無料           |
| Cloudflare R2    | Free     | $0（〜10GB）     | ゼロイグレス                      |
| 合計             |          | **$0 〜 $25/月** |                                   |

これで  
- 今すぐWebアプリを爆速で作れる  
- 将来Flutter / React Nativeアプリを追加しても認証・DB完全共用  
- ほぼ無料で運用可能  
- 全部TypeScriptで型安全  

が実現できます！  
このスタックで決まりです。次は`create-svelte`から始めてみてください！