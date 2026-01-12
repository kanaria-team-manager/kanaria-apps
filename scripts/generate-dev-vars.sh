#!/usr/bin/env bash
# Supabase Local の環境変数を .dev.vars に自動生成するスクリプト

set -e

BACKEND_DIR="packages/backend"
FRONTEND_DIR="packages/frontend"
DEV_VARS_FILE="$BACKEND_DIR/.dev.vars"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env"

echo "🔧 Generating .dev.vars and .env from Supabase Local..."

# Supabase statusを取得
STATUS=$(supabase status -o json 2>/dev/null)

if [ -z "$STATUS" ]; then
  echo "❌ Supabase is not running. Please run 'supabase start' first."
  exit 1
fi

# ステータスから必要な値を抽出
API_URL=$(echo "$STATUS" | grep "API_URL" | awk '{print $NF}' | sed -e 's/,$//g')
DB_URL=$(echo "$STATUS" | grep "DB_URL" | awk '{print $NF}' | sed -e 's/,$//g')
TEST_DB_URL=$(echo "$DB_URL" | sed 's/postgres"/kanaria_test"/g')
ANON_KEY=$(echo "$STATUS" | grep "ANON_KEY" | awk '{print $NF}' | sed -e 's/,$//g')
SERVICE_ROLE_KEY=$(echo "$STATUS" | grep "SERVICE_ROLE_KEY" | awk '{print $NF}' | sed -e 's/,$//g')
JWT_SECRET=$(echo "$STATUS" | grep "JWT_SECRET" | awk '{print $NF}' | sed -e 's/,$//g')
PUBLISHABLE_KEY=$(echo "$STATUS" | grep "PUBLISHABLE_KEY" | awk '{print $NF}' | sed -e 's/,$//g')

# .dev.vars ファイルを生成
cat > "$DEV_VARS_FILE" << EOF
# Supabase Local Development Configuration
# Auto-generated from 'supabase status'
# Run 'pnpm run env:generate' to regenerate

# Database URL
DATABASE_URL=$DB_URL
TEST_DATABASE_URL=$TEST_DB_URL

# Supabase Local API
SUPABASE_URL=$API_URL

# Supabase Keys
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# JWT Secret
SUPABASE_JWT_SECRET=$JWT_SECRET

# Frontend URL
FRONTEND_URL=http://localhost:5173
EOF

echo "✅ .dev.vars generated at $DEV_VARS_FILE"

# .env ファイルを生成
cat > "$FRONTEND_ENV_FILE" << EOF
# Backend API URL
# 開発環境では通常 http://localhost:8787
PUBLIC_BACKEND_URL="http://localhost:8787"
PUBLIC_SUPABASE_URL=$API_URL
PUBLIC_SUPABASE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY
EOF

echo "✅ .env generated at $FRONTEND_ENV_FILE"

