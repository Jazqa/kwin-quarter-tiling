# Quarter Tiling Script for KWin

## Features
- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Automatically creates and moves between virtual desktops
- Provides keybindings for moving the windows inside the layouts


## Screenshots

#### Basic functionality: 
![Functionality](http://i.imgur.com/GYfyHTY.gif)

#### Movement keys:
![Keybindings](http://imgur.com/W3HzO5A.gif)

[Video demonstration (a gfycat link)](https://gfycat.com/TintedRepentantKawala)


## Installation
    git clone https://github.com/Jazqa/kwin-quarter-tiling.git
    cd kwin-quarter-tiling
    plasmapkg2 --type kwinscript -i .
    mkdir -p ~/.local/share/kservices5
    cp ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop
After the installation, you might want to configure your keybindings. To do so, go to Settings » Shortcuts » Global Shortcuts » KWin and search for "Quarter" to find all the script specific shortcuts. Bind the ones you wish to use. "Float On/Off" is recommended for an easy way to tile and untile the active window.

## Help
- In case of trouble, restart the script by disabling it and enabling it again via KWin Scripts
- After changing the configuration, restart the script by disabling it and enabling it again.

#### Adding the keybindings:
![Keybindings](http://i.imgur.com/K3cHAUG.png)

#### Configuring the script:
![Configuration](http://i.imgur.com/UfTBwCS.png)


## Note
- If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed (it's a feature)
- Some programs, like Spotify, do not play nice with tiling and can not be recognized and/or automatically excluded. If you use such programs, use the "Float On/Off" shortcut to disable them.

## Upcoming features
- Window resizing
- Support for chosen programs to always occupy at least half of the screen
