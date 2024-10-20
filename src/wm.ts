import config from "./config";
import { registerShortcut, workspace } from "./kwin";
import { layer, Layers } from "./layer";
import math from "./math";
import { tile, Tile } from "./tile";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";

export interface Callbacks {
  enableWindow: (window: KWinWindow) => void;
  pushWindow: (window: KWinWindow) => void;
  resizeWindow: (window: KWinWindow, oldRect: QRect) => void;
  moveWindow: (window: KWinWindow, oldRect: QRect) => void;
}

export function wm() {
  const layers: Layers = {};
  const tiles: Array<Tile> = [];

  const callbacks = {
    enableWindow,
    pushWindow,
    resizeWindow,
    moveWindow,
  };

  // Layers
  function addLayer(output: KWinOutput, desktop: KWinVirtualDesktop) {
    if (config.exclude(output, desktop)) return;

    const id = output.serialNumber + desktop.id;
    if (layers[id]) return;

    const newLayer = layer(output, desktop);

    layers[id] = newLayer;
  }

  function tileLayers() {
    Object.values(layers).forEach((layer) => {
      layer.tile(tiles);
    });
  }

  // Tiles
  function swapTiles(i: number, j: number) {
    const tile: Tile = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = tile;
  }

  // Windows
  function addWindow(window: KWinWindow) {
    if (isWindowAllowed(window)) {
      const newTile = tile(window, callbacks);
      tiles.push(newTile);
      tileLayers();
    }
  }

  function removeWindow(window: KWinWindow) {
    const index = tiles.findIndex((tile) => tile.window.internalId === window.internalId);
    const tile = tiles[index];

    if (index > -1) {
      tile.remove();
      tiles.splice(index, 1);
      tileLayers();
    }
  }

  function resizeWindow(window: KWinWindow, oldRect: QRect) {
    window.desktops.forEach((desktop) => {
      const layer = layers[window.output.serialNumber + desktop.id];
      if (layer) {
        layer.resizeWindow(window, oldRect);
      }
    });

    tileLayers();
  }

  function moveWindow(window: KWinWindow, oldRect: QRect) {
    let nearestTile = tiles.find((tile) => tile.window.internalId === window.internalId);
    let nearestDistance = math.distanceTo(window.frameGeometry, oldRect);

    tiles.forEach((tile) => {
      if (window.internalId !== tile.window.internalId) {
        const distance = math.distanceTo(window.frameGeometry, tile.window.frameGeometry);
        if (distance < nearestDistance) {
          nearestTile = tile;
          nearestDistance = distance;
        }
      }
    });

    const i = tiles.findIndex((tile) => tile.window.internalId === window.internalId);
    const j = tiles.findIndex((tile) => tile.window.internalId === nearestTile.window.internalId);

    if (i !== j) {
      swapTiles(i, j);
    }

    tileLayers();
  }

  function enableWindow(window: KWinWindow) {
    tileLayers();
  }

  function pushWindow(window: KWinWindow) {
    const index = tiles.findIndex((tile) => tile.window.internalId === window.internalId);

    if (index > -1) {
      const tile = tiles[index];
      tiles.splice(index, 1);
      tiles.push(tile);
    }

    tileLayers();
  }

  function isWindowAllowed(window: KWinWindow) {
    return (
      window.managed &&
      window.normalWindow &&
      window.moveable &&
      window.resizeable &&
      window.rect.width >= config.minWidth &&
      window.rect.height >= config.minHeight &&
      config.processes.indexOf(window.resourceClass.toString().toLowerCase()) === -1 &&
      config.processes.indexOf(window.resourceName.toString().toLowerCase()) === -1 &&
      config.captions.some((caption) => window.caption.toString().toLowerCase().indexOf(caption) === -1)
    );
  }

  // Constructor
  workspace.screens.forEach((output) => {
    workspace.desktops.forEach((desktop) => {
      addLayer(output, desktop);
    });
  });

  workspace.stackingOrder.forEach((window) => {
    addWindow(window);
  });

  // Signals
  workspace.currentDesktopChanged.connect(tileLayers);

  workspace.windowAdded.connect(addWindow);

  workspace.windowRemoved.connect(removeWindow);

  workspace.windowActivated.connect(tileLayers);

  // Shortcuts
  function toggleActiveWindow() {
    const tile = tiles.find((tile) => tile.window.internalId === workspace.activeWindow.internalId);
    if (tile.isEnabled()) {
      tile.disable(true);
      tileLayers();
    } else {
      tile.enable(true);
      pushWindow(tile.window);
    }
  }

  registerShortcut("8137: Tile Window", "8137: Tile Window", "Meta+F", toggleActiveWindow);
}
