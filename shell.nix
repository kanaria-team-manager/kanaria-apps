{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    packages = with pkgs; [
        nodejs_24
        nodePackages.pnpm
    ];

    shellHook = ''
        echo "nix shell started"
        node --version
        npm --version
        pnpm --version
    '';
}
