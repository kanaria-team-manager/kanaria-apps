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
            # playwright関係はpnpmで管理する
          ] ++ playwrightDeps;

          shellHook = ''
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

            # 必要に応じて LD_LIBRARY_PATH を設定
            export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath playwrightDeps}:$LD_LIBRARY_PATH
            
            echo "Kanaria Dev Environment"
            echo "Node version: $(node --version)"
          '';
        };
      }
    );
}
