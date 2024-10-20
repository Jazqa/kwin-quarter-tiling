import config from "./config";
import { maximizeArea, workspace } from "./kwin";
import { Layout } from "./layouts/layout";
import { layouts } from "./layouts/layouts";
import math from "./math";
import { Tile } from "./tile";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";

export interface Layers {
  [id: string]: Layer;
}

export interface Layer {
  id: string;

  output: KWinOutput;
  desktop: KWinVirtualDesktop;

  tile: (tiles: Array<Tile>) => void;
  resizeWindow: (window: KWinWindow, oldRect: QRect) => void;
}

export function layer(output: KWinOutput, desktop: KWinVirtualDesktop): Layer {
  const id = output.serialNumber + desktop.id;
  const oi = math.kcfgOutputIndex(output);

  let _rect = math.withMargin(oi, maximizeArea(output, desktop));
  let _layout = layouts[config.layout[oi]](oi, _rect);

  if (config.limit[oi] > -1) {
    _layout.limit = Math.min(_layout.limit, config.limit[oi]);
  }

  // @returns boolean - Indicates whether the tile array was modifier during tiling
  function tile(tiles: Array<Tile>) {
    let i = 0;
    const includedTiles = [];
    tiles.forEach((tile) => {
      if (!tile.isEnabled()) return;

      if (tile.isOnOutput(output) && tile.isOnDesktop(desktop)) {
        if (i < _layout.limit) {
          i += 1;
          includedTiles.push(tile);
        } else {
          tile.disable();
        }
      }
    });

    const rects = _layout.getRects(includedTiles);
    includedTiles.forEach((tile, index) => {
      const rect = math.withGap(oi, rects[index]);
      tile.setFrameGeometry(rect);
    });
  }

  function resizeWindow(window: KWinWindow, oldRect: QRect) {
    _layout.resizeWindow(window, oldRect);
  }

  function hasRectChanged(newRect: QRect) {
    return (
      _rect.x !== newRect.x || _rect.y !== newRect.y || _rect.width !== newRect.width || _rect.height !== newRect.height
    );
  }

  function onRectChanged(newRect: QRect) {
    _rect = newRect;
    _layout.adjustRect(newRect);
  }

  return {
    output,
    desktop,
    id,
    tile,
    resizeWindow,
  };
}
