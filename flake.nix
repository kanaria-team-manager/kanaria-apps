{
  description = "Kanaria development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

      # Playwright 用のブラウザバイナリの依存関係
        playwrightDeps = with pkgs; [
          # ブラウザ実行に必要なライブラリ
          alsa-lib
          at-spi2-atk
          at-spi2-core
          atk
          cairo
          cups
          dbus
          expat
          ffmpeg
          glib
          gtk3
          libdrm
          libxkbcommon
          mesa
          nspr
          nss
          pango
          xorg.libX11
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
          xorg.libxcb
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            pnpm
            supabase-cli
            gh
            # Database
            postgresql_16
            # playwright関係はpnpmで管理する
          ] ++ playwrightDeps;

          shellHook = ''
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

            # 必要に応じて LD_LIBRARY_PATH を設定
            export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath playwrightDeps}:$LD_LIBRARY_PATH
            
            # PostgreSQL setup
            export PGDATA="$PWD/.postgres-data"
            export PGHOST="$PWD/.postgres"
            export PGDATABASE="kanaria_test"
            export PGPORT="54322"
            export DATABASE_URL="postgresql://postgres@localhost:54322/kanaria_test"

            # PostgreSQL initialization
            if [ ! -d "$PGDATA" ]; then
              echo "🔧 Initializing PostgreSQL..."
              initdb -D "$PGDATA" --no-locale --encoding=UTF8 -U postgres
              
              mkdir -p "$PGHOST"
              
              # Start PostgreSQL
              pg_ctl -D "$PGDATA" -l "$PGHOST/logfile" \
                -o "-k $PGHOST -p $PGPORT" start
              
              # Wait for PostgreSQL to be ready
              sleep 2
              
              # Create databases
              createdb -h "$PGHOST" -p "$PGPORT" -U postgres kanaria_dev
              createdb -h "$PGHOST" -p "$PGPORT" -U postgres kanaria_test
              
              echo "✅ PostgreSQL initialized"
            else
              # Start if not running
              if ! pg_ctl -D "$PGDATA" status > /dev/null 2>&1; then
                echo "🚀 Starting PostgreSQL..."
                pg_ctl -D "$PGDATA" -l "$PGHOST/logfile" \
                  -o "-k $PGHOST -p $PGPORT" start
                sleep 1
              fi
            fi

            # Helper functions
            db-stop() {
              echo "🛑 Stopping PostgreSQL..."
              pg_ctl -D "$PGDATA" stop
            }

            db-reset() {
              echo "🔄 Resetting test database..."
              dropdb -h "$PGHOST" -p "$PGPORT" -U postgres --if-exists kanaria_test
              createdb -h "$PGHOST" -p "$PGPORT" -U postgres kanaria_test
              cd packages/backend && pnpm drizzle-kit push
              echo "✅ Database reset complete"
            }

            db-console() {
              psql -h "$PGHOST" -p "$PGPORT" -U postgres "$PGDATABASE"
            }

            # Auto-cleanup on exit
            trap db-stop EXIT
            
            echo ""
            echo "🚀 Kanaria Dev Environment"
            echo "   Node version: $(node --version)"
            echo "   PostgreSQL: localhost:$PGPORT"
            echo "   Database: $DATABASE_URL"
            echo ""
            echo "📝 Commands:"
            echo "   db-stop     - Stop PostgreSQL"
            echo "   db-reset    - Reset test database"
            echo "   db-console  - Open psql console"
            echo ""
          '';
        };
      }
    );
}
