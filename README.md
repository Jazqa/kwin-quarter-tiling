# Quarter Tiling Script for KWin

## Features
- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Automatically creates and moves between virtual desktops
- Supports mouse and keyboard control

## Preview


## Installing

Arch Linux: [AUR](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Other: [KDE Store](https://store.kde.org/p/1187647/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    cd kwin-quarter-tiling
    plasmapkg2 --type kwinscript -i .
    mkdir -p ~/.local/share/kservices5
    cp ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop
    
**Keybindings:** Go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

**Configuration:** Script is configured through the configuration interface.

## Updating

**Git:** Set this repository as the git origin of `~/.local/share/kwin/scripts/quarter-tiling`. If you don't know how to do this, move the hidden .git folder inside the cloned folder to the location above. After this, the script can be updated by using `git fetch origin && git pull` inside `~/.local/share/kwin/scripts/quarter-tiling`. Alternatively, you can always re-clone the git repository and enter `plasmapkg2 --type kwinscript -u .` inside the cloned folder.

**AUR:** Arch users can keep the script updated through AUR.

## Uninstalling

`plasmapkg2 --type kwinscript -r .local/share/kwin/scripts/quarter-tiling`


## Note
- If you remove a virtual desktop, all of the tiled clients on the desktop will be closed.
- Some programs don't play nice with tiling. If you encounter one, add it to `Ignored Programs` or `Ignored Captions` to avoid issues.

#### Suggestions and bug reports are welcome!
