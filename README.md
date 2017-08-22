# Quarter Tiling Script for KWin

## Features
- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Automatically creates and moves between virtual desktops
- Supports mouse and [keyboard](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Keybindings)

## Preview
**Basics**
![Imgur](http://i.imgur.com/knyoWe6.gif)

**Resizing**
![Imgur](http://i.imgur.com/uc5FdxW.gif)

## Installing

Arch Linux: [AUR](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Other: [KDE Store](https://store.kde.org/p/1187647/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    plasmapkg2 --type kwinscript -i kwin-quarter-tiling
    mkdir -p ~/.local/share/kservices5
    ln -sf ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop

**[Configuration:](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Configuration-Interface)** Script is configured through the configuration interface.

**[Keybindings:](https://github.com/Jazqa/kwin-quarter-tiling/wiki/Keybindings)** Go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

## Updating

**Git:**

`git clone https://github.com/Jazqa/kwin-quarter-tiling.git && plasmapkg2 --type kwinscript -u kwin-quarter-tiling`

Alternatively, set this repository as the git origin of `~/.local/share/kwin/scripts/quarter-tiling`. If you don't know how to do this, move the hidden .git folder inside the cloned folder to the location above. After this, the script can be updated by using `git fetch origin && git pull`.

**AUR:** Arch users can keep the script updated through AUR.

## Uninstalling

`plasmapkg2 --type kwinscript -r .local/share/kwin/scripts/quarter-tiling`


## Note
- If you remove a virtual desktop, all of the tiled clients on the desktop will be closed.
- Some programs don't play nice with tiling. If you encounter one, add it to `Ignored Programs` or `Ignored Captions` to avoid issues.

#### Suggestions and bug reports are welcome!
