# Quarter Tiling Script for KWin
- Tiles windows (maximum four per desktop)
- Maintains the tiled layout when windows are interacted with (open, close, move, minimize, maximize)
- Automatically switches and creates virtual desktops
- Allows windows to be exluced from the script with a shortcut (Meta+F by default)

## Do not use yet if...
- You use more than one Plasma panel
- You except it to work flawlessly (spoiler: it doesn't)
- You use more than one screen (I have only one so I can't guarantee it doesn't explode when used with more)
- You wish to remain sane

## Screenshots

![Video demonstration (a gfycat link)](https://gfycat.com/TintedRepentantKawala)


![Screenshot](https://u.teknik.io/IZz6t.png)


## Help
- To install, move or clone to ~/.local/share/kwin/scripts and enable the script via KWin Scripts, I'll "package" it later
- **In case of problems: Meta+F or disable and enable through KWin Scripts**
- It's in a very early state so if it crashes (no notification, it'll just stop tiling), disable and enable it via KWin Scripts
- **Note:** If you remove a virtual desktop, all of the tiled clients on the desktop will also be closed
- By default, Meta+F excludes the **active window** from the script
- Virtual desktops are not automatically removed (it crashes Plasma, I'm still looking into it)
- Spotify can not be recognized or automatically excluded, if you use Spotify, manually exclude it with Meta+F each launch to avoid trouble
