import math from "../math";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

interface Separators {
  h: number;
  v: Array<number>;
}

function getTiles(rect: QRect, separators: Separators, count: number): Array<QRect> {
  const { x, y, width, height } = rect;
  const { v, h } = separators;

  const tiles = [
    {
      x,
      y,
      width: v[0] - x,
      height: h - y,
    },
    {
      x,
      y: h,
      width: v[1] - x,
      height: y + height - h,
    },
    {
      x: v[1],
      y: h,
      width: x + width - v[1],
      height: y + height - h,
    },
    {
      x: v[0],
      y,
      width: x + width - v[0],
      height: h - y,
    },
  ];

  if (count < 4) {
    tiles[0].width = tiles[3].x + tiles[3].width - tiles[0].x;
  }

  if (count < 3) {
    tiles[1].width = tiles[2].x + tiles[2].width - tiles[1].x;
  }

  if (count < 2) {
    tiles[0].height = tiles[1].y + tiles[1].height - tiles[0].y;
  }

  return tiles;
}

export function TwoByTwoVertical(oi: number, rect: QRect): Layout {
  const limit = 4;

  let hs = rect.y + rect.height * 0.5;
  let vs = rect.x + rect.width * 0.5;
  let separators = { h: hs, v: [vs, vs] };

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

    if (oldRect.y >= separators.h) {
      // Right
      separators.h += newRect.y - oldRect.y;
      if (oldRect.x >= separators.v[1]) {
        // Bottom right
        separators.v[1] += newRect.x - oldRect.x;
      } else {
        // Top right
        separators.v[1] += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
      }
    } else {
      separators.h += newRect.y === oldRect.y ? newRect.height - oldRect.height : 0;
      // Left
      if (oldRect.x >= separators.v[0]) {
        // Bottom left
        separators.v[0] += newRect.x - oldRect.x;
      } else {
        // Top left
        separators.v[0] += newRect.x === oldRect.x ? newRect.width - oldRect.width : 0;
      }
    }

    const maxV = 0.9 * (rect.x + rect.width);
    const minV = rect.x + rect.width * 0.1;

    const maxH = 0.9 * (rect.y + rect.height);
    const minH = rect.y + rect.height * 0.1;

    separators.v[0] = Math.min(Math.max(minV, separators.v[0]), maxV);
    separators.v[1] = Math.min(Math.max(minV, separators.v[1]), maxV);

    separators.h = Math.min(Math.max(minH, separators.h), maxH);
  }

  function restore() {
    hs = rect.y + rect.height * 0.5;
    vs = rect.x + rect.width * 0.5;
    separators = { h: hs, v: [vs, vs] };
  }

  return {
    limit,
    tileWindows,
    resizeWindow,
    adjustRect,
    restore,
  };
}
