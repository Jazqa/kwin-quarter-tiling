import math from "../math";
import { Tile } from "../tile";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

interface Separators {
  h: number;
  v: Array<number>;
}

function _getRects(rect: QRect, separators: Separators, count: number): Array<QRect> {
  const { x, y, width, height } = rect;
  const { v, h } = separators;

  const rects = [
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
    rects[0].width = rects[3].x + rects[3].width - rects[0].x;
  }

  if (count < 3) {
    rects[1].width = rects[2].x + rects[2].width - rects[1].x;
  }

  if (count < 2) {
    rects[0].height = rects[1].y + rects[1].height - rects[0].y;
  }

  return rects;
}

export function TwoByTwoVertical(oi: number, rect: QRect): Layout {
  const id = "2X2V";
  const limit = 4;

  let hs = rect.y + rect.height * 0.5;
  let vs = rect.x + rect.width * 0.5;
  let separators = { h: hs, v: [vs, vs] };

  function adjustRect(newRect: QRect) {
    rect = newRect;
    restore();
  }

  function getRects(windows: Array<KWinWindow>) {
    return _getRects(rect, separators, windows.length);
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

    const maxV = 0.75 * (rect.x + rect.width);
    const minV = rect.x + rect.width * 0.25;

    const maxH = 0.75 * (rect.y + rect.height);
    const minH = rect.y + rect.height * 0.25;

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
    id,
    limit,
    getRects,
    resizeWindow,
    adjustRect,
    restore,
  };
}
