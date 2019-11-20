# Quarter Tiling Script for KWin

## Features

- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Supports mouse and [keyboard](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Keybindings)
- (OPTIONAL): Automatically creates and moves between virtual desktops

## Preview

![d1](https://i.imgur.com/mjlK2s9.gif)

![d2](https://i.imgur.com/xsuEXhw.gif)

![d3](https://i.imgur.com/7rN8hg2.gif)

## Installing the script

Arch Linux: [AUR](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Other: [KDE Store](https://store.kde.org/p/1187647/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    plasmapkg2 --type kwinscript -i kwin-quarter-tiling
    mkdir -p ~/.local/share/kservices5
    ln -sf ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop

## Configuring the script

**[Configuration:](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Configuration-Interface)** Script is configured through the configuration interface. If you encounter any programs that don't play nice with tiling, add them to "Ignored Programs" or "Ignored Captions".

**[Keybindings:](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Keybindings)** Go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

## Updating the script

**Git**

`git clone https://github.com/Jazqa/kwin-quarter-tiling.git && plasmapkg2 --type kwinscript -u kwin-quarter-tiling`

Alternatively, set this repository as the git origin of `~/.local/share/kwin/scripts/quarter-tiling`. If you don't know how to do this, move the hidden .git folder inside the cloned folder to the location above. After this, the script can be updated by using `git fetch origin && git pull`.

**AUR**

Arch users can keep the script updated through AUR.

## Uninstalling the script

`plasmapkg2 --type kwinscript -r .local/share/kwin/scripts/quarter-tiling`

## Modifying the script and contributing to the project

As of 2.0, the script is written in TypeScript and transpiled to JavaScript for KWin to understand. If you modify the `.ts` files, you have to run `npm install && npm run transpile` to apply the changes.

New tiling layouts can be created without delving deeper into the existing code. New layouts should be new files under `src/layouts` and as long as they implement the interface described in `src/layout.ts` they should work with the script.

#### Suggestions and bug reports are welcome!
