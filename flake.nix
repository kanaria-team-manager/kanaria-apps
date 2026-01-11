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
            docker
            gh
            # Database CLIs for debugging
            postgresql_16
            # playwright関係はpnpmで管理する
          ] ++ playwrightDeps;

          shellHook = ''
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

            # 必要に応じて LD_LIBRARY_PATH を設定
            export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath playwrightDeps}:$LD_LIBRARY_PATH
            
            # Supabase Local setup
            export SUPABASE_DIR="$PWD/supabase"
            
            # Helper functions
            supabase-start() {
              echo "🚀 Starting Supabase Local..."
              supabase start
              echo ""
              echo "✅ Supabase is ready!"
              echo "   Studio: http://localhost:54323"
              echo "   API URL: http://localhost:54321"
              echo "   DB URL: postgresql://postgres:postgres@localhost:54322/postgres"
            }

            supabase-stop() {
              echo "🛑 Stopping Supabase..."
              supabase stop
            }

            supabase-reset() {
              echo "🔄 Resetting Supabase database..."
              supabase db reset
              echo "✅ Database reset complete"
            }

            supabase-status() {
              supabase status
            }

            db-console() {
              echo "📊 Opening Supabase DB console..."
              psql postgresql://postgres:postgres@localhost:54322/postgres
            }
            
            echo ""
            echo "🚀 Kanaria Dev Environment"
            echo "   Node version: $(node --version)"
            echo "   Supabase CLI: $(supabase --version)"
            echo ""
            echo "📝 Commands:"
            echo "   supabase-start  - Start Supabase (Auth, DB, Studio)"
            echo "   supabase-stop   - Stop Supabase"
            echo "   supabase-reset  - Reset database"
            echo "   supabase-status - Show Supabase status"
            echo "   db-console      - Open psql console"
            echo ""
            echo "💡 Run 'supabase-start' to begin local development"
            echo ""
          '';
        };
      }
    );
}
