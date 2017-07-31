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
Arch Linux: [AUR (thanks to mareex)](https://aur.archlinux.org/packages/kwin-scripts-quarter-tiling-git/)

Manually:

    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    cd kwin-quarter-tiling
    plasmapkg2 --type kwinscript -i .
    mkdir -p ~/.local/share/kservices5
    cp ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop
**Note:** After the installation, you might want to configure your keybindings. To do so, go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

**Protip:** Currently, the best way to keep the script updates is to move the .git folder to ~/.local/share/kwin/scripts/quarter-tiling/ and use git fetch origin && git pull to update the script.


## Help
- In case of trouble, restart the script by disabling it and enabling it again via KWin Scripts
- After changing the configuration, restart the script by disabling it and enabling it again.

#### Adding the keybindings:
![Keybindings](http://i.imgur.com/K3cHAUG.png)


#### Configuring the script:
![Configuration](http://i.imgur.com/UfTBwCS.png)


## Note
- If you have multiple clients open from earlier session, the script might not start succesfully and you'll have to restart it (I'm working on this).
- If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed (it's a feature).
- Some programs, like Spotify, do not play nice with tiling and can not be recognized and/or automatically excluded. If you use such programs, use the "Float On/Off" shortcut to disable them.

#### Suggestions and bug reports are welcome! File them under the issues-section and I'll adress them as soon as I can.
