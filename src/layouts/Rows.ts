import math from "../math";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

export function Rows(oi: number, rect: QRect): Layout {
  const id = "Rows";
  const minHeight = 300;
  const limit = rect.height / (minHeight * 1.5);

  const height = rect.y + rect.height;

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
      const base = height / d;
      const res = resized[i] || 0;
      separators[i] = base + res;
    }

    const rects = [];
    for (var i = 0; i < separators.length; i++) {
      let end = separators[i];
      let start = rect.y;
      if (i > 0) {
        start = separators[i - 1];
      }

      rects.push({ x: rect.x, y: start, width: rect.width, height: end - start });
    }

    return rects;
  }

  function resizeWindow(window: KWinWindow, oldRect: QRect) {
    const newRect = math.clone(window.frameGeometry);

    let y = oldRect.y;

    let separatorDir = -1; // Down
    if (newRect.y - oldRect.y === 0) {
      y = oldRect.y + oldRect.height;
      separatorDir = 1; // Up
    }

    let i = -1;
    let distance = y - rect.y;
    let distanceAbs = Math.abs(distance);

    for (var j = 0; j < separators.length; j++) {
      const newDistance = y - separators[j];
      const newDistanceAbs = Math.abs(newDistance);

      if (newDistanceAbs < distanceAbs) {
        distance = newDistance;
        distanceAbs = newDistanceAbs;
        i = j;
      }
    }

    // Stops resizing from screen edges
    if (i < 0 || i === separators.length - 1) return;

    let diff = oldRect.height - newRect.height;
    if (separatorDir > 0) {
      diff = newRect.height - oldRect.height;
    }

    if (!resized[i]) {
      resized[i] = 0;
    }

    let newSeparator = separators[i] + diff;

    // Stops resizing over screen edges or other separators
    if (newSeparator <= rect.y + minHeight || newSeparator >= rect.y + rect.height - minHeight) return;
    if (newSeparator <= separators[i - 1] + minHeight || newSeparator >= separators[i + 1] - minHeight) return;

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
