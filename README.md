# Quarter Tiling Script for KWin

## Features
- Tiles windows
- Maintains the tiled layout when windows are interacted with
- Automatically creates, switches and removes virtual desktops
- Shortcuts for moving windows within the script
- Shortcut for excluding windows
- **NOTE: You might have to bind the keys manually. To do so, go to settings --> shortcuts --> global shortcuts --> kwin and search for "Quarter" to find all the script specific shortcuts!**


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

## Help
- **To bind shortcuts go to settings --> shortcuts --> global shortcuts --> kwin and search for "Quarter" to find all the script specific shortcuts!**
- In case of trouble, restart the script by disabling it and enabling it again via KWin Scripts
- As of now, configuration is done via main.js
  - To adjust gapsize, edit "var gap" (size in pixels)
  - To disable borders, edit "var noBorders" (true or false)
  - To add/remove programs from the blacklist edit "var ignoredClients"
  - If above does not work, try adding a recognizable and unique part of the window caption to "var ignoredCaptions"

## Note
- If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed (it's a feature)
- Some programs, like Spotify, do not play nice with tiling and can not be recognized and/or automatically excluded. If you use such programs, use the "Float On/Off" shortcut to disable them.

## Upcoming features
- Configuration interface
- Window resizing
- Support for chosen programs to always occupy at least half of the screen
