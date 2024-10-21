import { Edge, rectClone } from "../math";
import { Layout } from "../types/layout";
import { QRect } from "../types/qt";
import { Window } from "../window";

let i = 0;

export class Columns implements Layout {
  id: string;

  minWindowWidth: number = 500;

  rect: QRect;
  limit: number;

  separators: Array<number> = [];
  resized: Array<number> = [];

  constructor(rect: QRect) {
    this.id = "C" + i;
    i++;

    this.rect = rect;
    this.limit = 2;
  }

  adjustRect = (newRect: QRect) => {
    this.rect = newRect;
    this.reset();
  };

  resetSeparators = (windows: Array<Window>) => {
    if (windows.length > this.separators.length) {
      for (var i = 0; i < this.resized.length; i++) {
        if (this.resized[i]) {
          this.resized[i] *= 0.5;
        }
      }
    }

    this.separators.splice(windows.length - 1);
    this.resized.splice(windows.length - 1);
  };

  tileWindows = (windows: Array<Window>) => {
    this.resetSeparators(windows);

    for (var i = 0; i < windows.length; i++) {
      const j = i + 1;
      const d = windows.length / j;
      const base = this.rect.x + this.rect.width / d;
      const res = this.resized[i] || 0;
      this.separators[i] = base + res;
    }

    const tiles = [];
    for (var i = 0; i < this.separators.length; i++) {
      let end = this.separators[i];
      let start = this.rect.x;
      if (i > 0) {
        start = this.separators[i - 1];
      }

      tiles.push({ x: start, y: this.rect.y, width: end - start, height: this.rect.height });
    }

    windows.forEach((window, index) => {
      const tile = tiles[index];
      window.setFrameGeometry(tile);
    });
  };

  resizeWindow = (window: Window, oldRect: QRect): Edge => {
    const newRect = rectClone(window.kwin.frameGeometry);

    let x = oldRect.x;

    let separatorDir = -1;
    if (newRect.x - oldRect.x === 0) {
      x = oldRect.right;
      separatorDir = 1;
    }

    let i = -1;
    let distance = x - this.rect.x;
    let distanceAbs = Math.abs(distance);

    for (var j = 0; j < this.separators.length; j++) {
      const newDistance = x - this.separators[j];
      const newDistanceAbs = Math.abs(newDistance);

      if (newDistanceAbs < distanceAbs) {
        distance = newDistance;
        distanceAbs = newDistanceAbs;
        i = j;
      }
    }

    const edges = this.checkEdges(i, oldRect, newRect);

    // Stop resizing from rect edges
    if (i < 0 || i === this.separators.length - 1) return edges;

    let diff = oldRect.width - newRect.width;
    if (separatorDir > 0) {
      diff = newRect.width - oldRect.width;
    }

    // Stops resizing over rect edges and other separators
    const prevSeparator = i === 0 ? this.rect.x : this.separators[i - 1];
    const minX = prevSeparator + this.minWindowWidth;
    if (this.separators[i] + diff <= minX) {
      diff = minX - this.separators[i];
    }

    const nextSeparator = i === this.separators.length - 1 ? this.rect.right : this.separators[i + 1];
    const maxX = nextSeparator - this.minWindowWidth;
    if (this.separators[i] + diff >= maxX) {
      diff = maxX - this.separators[i];
    }

    if (!this.resized[i]) this.resized[i] = 0;
    this.resized[i] = this.resized[i] + diff;

    return edges;
  };

  checkEdges = (index: number, newRect: QRect, oldRect: QRect): Edge => {
    const edge: Edge = new Edge();

    if (newRect.top !== oldRect.top) {
      edge.top = oldRect.top - newRect.top;
    }

    if (newRect.bottom !== oldRect.bottom) {
      edge.bottom = oldRect.bottom - newRect.bottom;
    }

    if (index < 0 && newRect.width !== oldRect.width) {
      edge.left = oldRect.width - newRect.width;
    }

    if (index === this.separators.length - 1 && newRect.width !== oldRect.width) {
      edge.left = oldRect.width - newRect.width;
    }

    return edge;
  };

  reset() {}
}
