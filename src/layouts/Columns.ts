import math from "../math";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

export function Columns(oi: number, rect: QRect): Layout {
  const id = "Columns";
  const minWidth = 500;
  const limit = rect.width / (minWidth * 1.5);

  const width = rect.x + rect.width;

  const separators = [];
  const resized = [];

  function adjustRect(newRect: QRect) {
    rect = newRect;
    restore();
  }

  function flushSeparators(windows: Array<KWinWindow>) {
    if (windows.length > separators.length) {
      for (var i = 0; i < resized.length; i++) {
        if (resized[i]) {
          resized[i] *= 0.5;
        }
      }
    }

    separators.splice(windows.length - 1);
    resized.splice(windows.length - 1);
  }

  function getRects(windows: Array<KWinWindow>) {
    flushSeparators(windows);

    for (var i = 0; i < windows.length; i++) {
      const j = i + 1;
      const d = windows.length / j;
      const base = width / d;
      const res = resized[i] || 0;
      separators[i] = base + res;
    }

    const rects = [];
    for (var i = 0; i < separators.length; i++) {
      let end = separators[i];
      let start = rect.x;
      if (i > 0) {
        start = separators[i - 1];
      }

      rects.push({ x: start, y: rect.y, width: end - start, height: rect.height });
    }

    return rects;
  }

  function resizeWindow(window: KWinWindow, oldRect: QRect) {
    const newRect = math.clone(window.frameGeometry);

    let x = oldRect.x;

    let separatorDir = -1; // Right
    if (newRect.x - oldRect.x === 0) {
      x = oldRect.x + oldRect.width;
      separatorDir = 1; // Left
    }

    let i = -1;
    let distance = x - rect.x;
    let distanceAbs = Math.abs(distance);

    for (var j = 0; j < separators.length; j++) {
      const newDistance = x - separators[j];
      const newDistanceAbs = Math.abs(newDistance);

      if (newDistanceAbs < distanceAbs) {
        distance = newDistance;
        distanceAbs = newDistanceAbs;
        i = j;
      }
    }

    // Stops resizing from screen edges
    if (i < 0 || i === separators.length - 1) return;

    let diff = oldRect.width - newRect.width;
    if (separatorDir > 0) {
      diff = newRect.width - oldRect.width;
    }

    if (!resized[i]) {
      resized[i] = 0;
    }

    let newSeparator = separators[i] + diff;

    // Stops resizing over screen edges or other separators
    if (newSeparator <= rect.x + minWidth || newSeparator >= rect.x + rect.width - minWidth) return;
    if (newSeparator <= separators[i - 1] + minWidth || newSeparator >= separators[i + 1] - minWidth) return;

    resized[i] = resized[i] + diff;
  }

  function restore() {}

  return {
    id,
    limit,
    getRects,
    resizeWindow,
    adjustRect,
    restore,
  };
}
