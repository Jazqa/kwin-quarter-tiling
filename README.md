# Quarter Tiling Script for KWin
- Tiles windows (maximum four per desktop)
- Maintains the tiled layout when windows are interacted with (open, close, move, minimize, maximize)
- Automatically switches and creates virtual desktops
- Allows windows to be exluced from the script with a shortcut (Meta+F by default)

[Demonstration](https://gfycat.com/TintedRepentantKawala)


## Help
- To install, move or clone to ~/.local/share/kwin/scripts and enable the script via KWin scripts, I'll "package" it later
- It's in a very early state so if it crashes (no notification, it'll just stop tiling), disable and enable it via KWin scripts
- **Note:** If you remove a workspace, all of the tiled clients will also be closed
- By default, Meta+F excludes the **active window** from the script
- Workspaces are not automatically removed (it crashes Plasma, I'm still looking into it)
- Spotify can not be recognized or automatically excluded, if you use Spotify, manually exclude it with Meta+F each launch to avoid trouble
