import math from "../math";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

interface Separators {
  h: Array<number>;
  v: number;
}

function getTiles(rect: QRect, separators: Separators, count: number): Array<QRect> {
  const { x, y, width, height } = rect;
  const { v, h } = separators;

  const tiles = [
    {
      x,
      y,
      width: v - x,
      height: h[0] - y,
    },
    {
      x: v,
      y,
      width: x + width - v,
      height: h[1] - y,
    },
    {
      x: v,
      y: h[1],
      width: x + width - v,
      height: y + height - h[1],
    },
    {
      x,
      y: h[0],
      width: v - x,
      height: y + height - h[0],
    },
  ];

  if (count < 4) {
    tiles[0].height = tiles[3].y + tiles[3].height - tiles[0].y;
  }

  if (count < 3) {
    tiles[1].height = tiles[2].y + tiles[2].height - tiles[1].y;
  }

  if (count < 2) {
    tiles[0].width = tiles[1].x + tiles[1].width - tiles[0].x;
  }

  return tiles;
}

export function TwoByTwoHorizontal(oi: number, rect: QRect): Layout {
  const id = "2X2H";
  const limit = 4;

  let hs = rect.y + rect.height * 0.5;
  let vs = rect.x + rect.width * 0.5;
  let separators = { h: [hs, hs], v: vs };

  function adjustRect(newRect: QRect) {
    rect = newRect;
    restore();
  }

  function tileWindows(windows: Array<KWinWindow>) {
    const tiles = getTiles(rect, separators, windows.length);
    windows.forEach((window, index) => {
      window.frameGeometry = math.withGap(oi, tiles[index]);
    });
  }

  function resizeWindow(window: KWinWindow, oldRect: QRect) {
    const newRect = math.clone(window.frameGeometry);

    if (oldRect.x >= separators.v) {
      // Right
      separators.v += newRect.x - oldRect.x;
      if (oldRect.y >= separators.h[1]) {
        // Bottom right
        separators.h[1] += newRect.y - oldRect.y;
      } else {
        // Top right
        separators.h[1] += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
      }
    } else {
      separators.v += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
      // Left
      if (oldRect.y >= separators.h[0]) {
        // Bottom left
        separators.h[0] += newRect.y - oldRect.y;
      } else {
        // Top left
        separators.h[0] += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
      }
    }

    const maxV = 0.9 * (rect.x + rect.width);
    const minV = rect.x + rect.width * 0.1;

    const maxH = 0.9 * (rect.y + rect.height);
    const minH = rect.y + rect.height * 0.1;

    separators.v = Math.min(Math.max(minV, separators.v), maxV);

    separators.h[0] = Math.min(Math.max(minH, separators.h[0]), maxH);
    separators.h[1] = Math.min(Math.max(minH, separators.h[1]), maxH);
  }

  function restore() {
    hs = rect.y + rect.height * 0.5;
    vs = rect.x + rect.width * 0.5;
    separators = { h: [hs, hs], v: vs };
  }

  return {
    id,
    limit,
    tileWindows,
    resizeWindow,
    adjustRect,
    restore,
  };
}
