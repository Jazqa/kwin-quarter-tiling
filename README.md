# Quarter Tiling Script for KWin
- Tiles windows (maximum four per desktop)
- Maintains the tiled layout when windows are interacted with (open, close, move, minimize, maximize)
- Automatically switches and creates virtual desktops
- Allows windows to be exluced from the script with a shortcut (Meta+F by default)

## Screenshots

[Video demonstration (a gfycat link)](https://gfycat.com/TintedRepentantKawala)


![Screenshot](https://u.teknik.io/IZz6t.png)


## Installation
- Move or clone to ~/.local/share/kwin/scripts and enable the script via KWin Scripts

## Help
- **Meta (WinKey) + F excludes the current window from the script**
- In case Meta + F is not working, go to settings > shortcuts > global shortcuts > kwin and search for "Float", bind a shortcut for the action "Float On/Off"
- In case of trouble, disable the script and enable it again via KWin Scripts
- **Note:** If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed
- Virtual desktops are not automatically removed (it crashes Plasma, I'm still looking into it)
- Spotify can not be recognized or automatically excluded, if you use Spotify, manually exclude it with Meta+F each launch to avoid trouble
