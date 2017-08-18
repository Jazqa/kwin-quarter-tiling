# Quarter Tiling Script for KWin

## Features
- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Automatically creates and moves between virtual desktops
- Provides keybindings for moving and resizing the windows inside the layouts


## Screenshots

#### Basic functionality:
![Functionality](http://i.imgur.com/GYfyHTY.gif)

#### Movement keys:
![Keybindings](http://imgur.com/W3HzO5A.gif)

#### Resizing:
![Resizing](http://i.imgur.com/O9aoQPk.gif)


## Installation

#### Installing
Arch Linux: [AUR (thanks to mareex)](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    cd kwin-quarter-tiling
    plasmapkg2 --type kwinscript -i .
    mkdir -p ~/.local/share/kservices5
    cp ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop
**Note:** After the installation, you might want to configure your keybindings. To do so, go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

#### Updating
Currently, the best ways to keep the script updated are either moving the .git folder to `~/.local/share/kwin/scripts/quarter-tiling/` (or initializing `path/to/quarter-tiling` as a git folder and setting this repository the origin, if that's easier for you) and using `git fetch origin && git pull` to update the script or always re-cloning the git folder and using `plasmapkg2 --type kwinscript -u .` inside the cloned folder.

#### Uninstalling
Either navigate to the script folder and use `plasmapkg2 --type kwinscript -r .` or re-clone the folder and enter the earlier command inside the cloned folder.

**Note** On all the `plasmapk2 --type kwinscript -parameter .` the `.` stands for `path/to/quarter-tiling`. I'm just assuming you're inside the folder to make things simpler for both of us.


## Help
- In case of trouble, restart the script by disabling it and enabling it again via KWin Scripts or by restarting KWin (by typing `kwin --replace` to krunner).
- After changing the configuration, restart the script by disabling it and enabling it again or simply by restarting KWin.

#### Adding the keybindings:
![Keybindings](http://i.imgur.com/K3cHAUG.png)


#### Configuring the script:
![Configuration](http://i.imgur.com/UfTBwCS.png)


## Note
- If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed (it's a feature).
- Some programs, don't play nice with tiling. If you encounter one, add it to `Ignored Programs` or `Ignored Captions` to avoid issues.

#### Suggestions and bug reports are welcome! File them under the issues-section and I'll address them as soon as I can.
