{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    packages = with pkgs; [
        nodejs_24
        nodePackages.pnpm
        playwright-driver.browsers
    ];

    shellHook = ''
        export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}/ms-playwright  # ms-playwright サブディレクトリを指定
        export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
        export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
        # 追加: デバッグ用（必要なら）
        export DEBUG="pw:browser*"
        echo "PLAYWRIGHT_BROWSERS_PATH: $PLAYWRIGHT_BROWSERS_PATH"
        ls -la $PLAYWRIGHT_BROWSERS_PATH/chromium-*/  # パス確認用（エラー時はこれでデバッグ）
        echo "nix shell started"
        node --version
        npm --version
        pnpm --version
    '';
}
