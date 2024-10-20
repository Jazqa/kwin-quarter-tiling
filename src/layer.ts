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

  function tile(tiles: Array<Tile>) {
    const windows = [];

    let i = 0;

    tiles.forEach((tile) => {
      if (tile.isOnOutput(output) && tile.isOnDesktop(desktop)) {
        const enabled = tile.isEnabled();
        if (i < _layout.limit && enabled) {
          i += 1;
          windows.push(tile.window);
        } else if (enabled) {
          tile.disable();
        }
      }
    });

    _layout.tileWindows(windows);
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
