import config from "./config";
import { workspace } from "./kwin";
import { Layout } from "./layouts/layout";
import { layouts } from "./layouts/layouts";
import math from "./math";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { tile, Tile } from "./tile";

interface Layers {
  [id: string]: Layer;
}

interface Layer {
  output: KWinOutput;
  desktop: KWinVirtualDesktop;
  id: string;
  rect: QRect;
  layout: Layout;
}

function layer(output: KWinOutput, desktop: KWinVirtualDesktop): Layer {
  const id = output.serialNumber + desktop.id;

  let rect = math.withMargin(workspace.clientArea(2, output, desktop));
  let layout = layouts[config.layout](rect);

  if (config.maxWindows > -1) {
    layout.maxWindows = Math.min(layout.maxWindows, config.maxWindows);
  }

  function hasRectChanged(newRect: QRect) {
    return (
      rect.x !== newRect.x || rect.y !== newRect.y || rect.width !== newRect.width || rect.height !== newRect.height
    );
  }

  function onRectChanged(newRect: QRect) {
    rect = newRect;
    layout.adjustRect(newRect);
  }

  return {
    output,
    desktop,
    id,
    rect,
    layout,
  };
}

export interface Callbacks {
  resizeWindow: (window: KWinWindow, oldRect: QRect) => void;
  moveWindow: (window: KWinWindow, oldRect: QRect) => void;
}

export function wm() {
  const layers: Layers = {};
  const tiles: Array<Tile> = [];

  const callbacks = {
    resizeWindow,
    moveWindow,
  };

  function addLayer(output: KWinOutput, desktop: KWinVirtualDesktop) {
    if (config.isIgnoredLayer(output, desktop)) return;

    const newLayer = layer(output, desktop);

    layers[newLayer.id] = newLayer;
  }

  function tileLayers() {
    Object.values(layers).forEach((layer) => {
      let windows = tiles.map((tile) => {
        if (tile.isOnOutput(layer.output) && tile.isOnDesktop(layer.desktop)) {
          return tile.window;
        }
      });

      windows = windows.filter((window) => window);

      layer.layout.tileWindows(windows);
    });
  }

  function swapTiles(i: number, j: number) {
    const tile: Tile = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = tile;
  }

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
        layer.layout.resizeWindow(window, oldRect);
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

  function isWindowAllowed(window: KWinWindow) {
    return window.resourceClass.toString().includes("dolphin");

    /*
    TODO: Uncomment
    return (
      window.managed &&
      window.normalWindow &&
      window.moveable &&
      window.resizeable &&
      window.maximizable &&
      !window.fullScreen &&
      !window.minimized &&
      window.rect.width >= config.minWidth &&
      window.rect.height >= config.minHeight &&
      config.ignoredClients.indexOf(window.resourceClass.toString()) === -1 &&
      config.ignoredClients.indexOf(window.resourceName.toString()) === -1 &&
      config.ignoredCaptions.some(
        (caption) => window.caption.toString().toLowerCase().indexOf(caption.toLowerCase()) === -1
      )
    );
    */
  }

  workspace.screens.forEach((output) => {
    workspace.desktops.forEach((desktop) => {
      addLayer(output, desktop);
    });
  });

  workspace.stackingOrder.forEach((window) => {
    addWindow(window);
  });

  workspace.windowAdded.connect(addWindow);

  workspace.windowRemoved.connect(removeWindow);

  workspace.windowActivated.connect(tileLayers);
}
