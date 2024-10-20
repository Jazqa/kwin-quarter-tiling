# Yet Another KWin Tiling Script

An easy tiling script for KWin.

## Preview

![d1](https://i.imgur.com/mjlK2s9.gif)

![d2](https://i.imgur.com/xsuEXhw.gif)

![d3](https://i.imgur.com/7rN8hg2.gif)

## Installation

**Manual:**

    git clone https://github.com/Jazqa/kwin-yakts.git
    cd ./kwin-yakts
    git checkout plasma-6
    kpackagetool6 --type=KWin/Script -r yakts || true
    kpackagetool6 --type=KWin/Script -i .
    cd ..
    rm -rf ./kwin-yakts

## Configuration

The script can be configured through its configuration interface under `System Settings > Window Management > KWin Scripts`. You can filter problematic windows with process names, window captions or window sizes.

## Shortcuts

KWin shortcuts can be found in `System Settings > Shortcuts > Global Shortcuts > KWin`.

All `(YAKTS) <ACTION>` -shortcuts are used exclusively by the script, but the script supports a variety of KWin shortcuts as well. For example, KWin's `Move Window <DIRECTION>` -shortcuts also move the script's tiles.

Binding the `(YAKTS) Tile Window` -shortcut is recommended, because it makes untiling problematic windows easy.

## Updates

**Git:**

    git clone https://github.com/Jazqa/kwin-yakts.git
    cd ./kwin-yakts
    git checkout plasma-6
    kpackagetool6 --type=KWin/Script -r yakts || true
    kpackagetool6 --type=KWin/Script -i .
    cd ..
    rm -rf ./kwin-yakts

Alternatively, set this repository as the origin of `~/.local/share/kwin/scripts/yakts` to update it with `git pull`.

## Uninstallation

    kpackagetool6 --type=KWin/Script -r yakts
    qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.cleanUp

The script can also be uninstalled from `System Settings > Window Management > KWin Scripts`.

## Contributions and adjustments

The script is written in TypeScript, transpiled to JavaScript and rolled up into a single `main.js` file. If you modify the `.ts` files, you have to run `npm run transpile`

New tiling layouts can be created without touching the existing code. New layouts should be placed under `src/layouts`. New layouts will work as long as the layouts implement the interface described in `src/layout.ts`. If you create a new layout, feel free to open a pull request and it'll be added to master.
