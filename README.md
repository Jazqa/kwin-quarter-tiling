# Quarter Tiling Script for KWin

## Description

Easy tiling script for KWin. Thanks to the simple tiling layouts and mouse-driven controls, the script should feel familiar to users with no prior experience with tiling window managers.

The script is not supposed to be a replacement for a tiling window manager, but a simple tool to easily combine the strengths of tiling and floating window managers.

## Preview

![d1](https://i.imgur.com/mjlK2s9.gif)

![d2](https://i.imgur.com/xsuEXhw.gif)

![d3](https://i.imgur.com/7rN8hg2.gif)

## Installation

Arch Linux: [AUR](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Other: [KDE Store](https://store.kde.org/p/1187647/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    plasmapkg2 --type kwinscript -i kwin-quarter-tiling
    mkdir -p ~/.local/share/kservices5
    ln -sf ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop

## Configuration

The script is configured through the configuration interface under "Kwin Scripts". If you encounter programs that do not work with tiling, you can ignore them via the configuration interface.

## Shortcuts

Go to `System Settings » Shortcuts » Global Shortcuts » KWin` and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

## Updates

**Git**

`git clone https://github.com/Jazqa/kwin-quarter-tiling.git && plasmapkg2 --type kwinscript -u kwin-quarter-tiling`

Alternatively, set this repository as the git origin of `~/.local/share/kwin/scripts/quarter-tiling`. If you don't know how to do this, move the hidden .git folder inside the cloned folder to the location above. After this, the script can be updated by using `git fetch origin && git pull`.

**AUR**

Arch users can keep the script updated through AUR.

## Uninstallation

`plasmapkg2 --type kwinscript -r .local/share/kwin/scripts/quarter-tiling`

## Contributions and adjustments

The script is written in TypeScript and transpiled to JavaScript. If you modify the `.ts` files, you have to run `npm install && npm run transpile` to apply the changes you've made.

New tiling layouts can be created without touching the existing code. New layouts should be placed under `src/layouts`. New layouts will work as long as the layouts implement the interface described in `src/layout.ts`. If you create a new layout, feel free to open a pull request and it'll be added to master.

#### Suggestions, pull requests and bug reports are welcome!
