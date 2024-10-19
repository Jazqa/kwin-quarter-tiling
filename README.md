# Quarter Tiling Script for KWin

## Description

An easy tiling script for KWin.

## Preview

![d1](https://i.imgur.com/mjlK2s9.gif)

![d2](https://i.imgur.com/xsuEXhw.gif)

![d3](https://i.imgur.com/7rN8hg2.gif)

## Installation

**Manual:**

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git && kpackagetool6 --type=KWin/Script -i ./kwin-quarter-tiling

## Configuration

The script can be configured through its configuration interface under `System Settings > Window Management > KWin Scripts`. You can filter problematic windows with process names, window captions or window sizes.

## Shortcuts

The script adds new KWin shortcuts under `System Settings > Shortcuts > Global Shortcuts > KWin`. All `Quarter: <ACTION>` shortcuts are used exclusively by the script.

## Updates

**Git:**

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git && kpackagetool6 --type=KWin/Script -i ./kwin-quarter-tiling

Alternatively, set this repository as the origin of `~/.local/share/kwin/scripts/quarter-tiling` to update it with `git pull`.

## Uninstallation

The script can be uninstalled from `System Settings > Window Management > KWin Scripts`.

## Contributions and adjustments

The script is written in TypeScript, transpiled to JavaScript and rolled up into a single `main.js` file. If you modify the `.ts` files, you have to run `npm run transpile`

New tiling layouts can be created without touching the existing code. New layouts should be placed under `src/layouts`. New layouts will work as long as the layouts implement the interface described in `src/layout.ts`. If you create a new layout, feel free to open a pull request and it'll be added to master.
