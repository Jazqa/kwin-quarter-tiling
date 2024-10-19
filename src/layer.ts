import config from "./config";
import { workspace } from "./kwin";
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
  output: KWinOutput;
  desktop: KWinVirtualDesktop;
  id: string;
  rect: QRect;
  layout: Layout;
  tile: (tiles: Array<Tile>) => void;
}

export function layer(output: KWinOutput, desktop: KWinVirtualDesktop): Layer {
  const id = output.serialNumber + desktop.id;

  const oi = math.outputIndex(output);

  let rect = math.withMargin(oi, workspace.clientArea(2, output, desktop));
  let layout = layouts[config.layout[oi]](oi, rect);

  if (config.limit[oi] > -1) {
    layout.limit = Math.min(layout.limit, config.limit[oi]);
  }

  function tile(tiles: Array<Tile>) {
    const includedTiles = tiles.filter((tile) => tile.isOnOutput(output) && tile.isOnDesktop(desktop));

    let i = 0;
    let windows = includedTiles
      .map((tile) => {
        if (i < layout.limit && tile.enabled) {
          i++;
          return tile.window;
        } else {
          tile.enabled = false;
        }
      })
      .filter((window) => window)
      .slice(0, layout.limit);

    layout.tileWindows(windows);
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
    tile,
  };
}
