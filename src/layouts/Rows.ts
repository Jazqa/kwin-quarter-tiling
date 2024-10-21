import { rectClone } from "../math";
import { QRect } from "../types/qt";
import { Window } from "../window";
import { Layout } from "../types/layout";

export class Rows implements Layout {
  id: string = "Rows";

  minWindowHeight: number = 280;

  rect: QRect;
  limit: number;

  separators: Array<number> = [];
  resized: Array<number> = [];

  constructor(rect: QRect) {
    this.rect = rect;
    this.limit = this.rect.height / this.minWindowHeight;
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
      const base = this.rect.y + this.rect.height / d;

      const res = this.resized[i] || 0;
      this.separators[i] = base + res;
    }

    const tiles = [];
    for (var i = 0; i < this.separators.length; i++) {
      let end = this.separators[i];
      let start = this.rect.y;
      if (i > 0) {
        start = this.separators[i - 1];
      }

      tiles.push({ x: this.rect.x, y: start, width: this.rect.width, height: end - start });
    }

    windows.forEach((window, index) => {
      const tile = tiles[index];
      window.setFrameGeometry(tile);
    });
  };

  resizeWindow = (window: Window, oldRect: QRect) => {
    const newRect = rectClone(window.kwin.frameGeometry);

    let y = oldRect.y;

    let separatorDir = -1; // Down
    if (newRect.y - oldRect.y === 0) {
      y = oldRect.bottom;
      separatorDir = 1; // Up
    }

    let i = -1;
    let distance = y - this.rect.y;
    let distanceAbs = Math.abs(distance);

    for (var j = 0; j < this.separators.length; j++) {
      const newDistance = y - this.separators[j];
      const newDistanceAbs = Math.abs(newDistance);

      if (newDistanceAbs < distanceAbs) {
        distance = newDistance;
        distanceAbs = newDistanceAbs;
        i = j;
      }
    }

    // Stops resizing from rect edges
    if (i < 0 || i === this.separators.length - 1) return;

    let diff = oldRect.height - newRect.height;
    if (separatorDir > 0) {
      diff = newRect.height - oldRect.height;
    }

    // Stops resizing over rect edges and other separators
    const prevSeparator = i === 0 ? this.rect.y : this.separators[i - 1];
    const minY = prevSeparator + this.minWindowHeight;
    if (this.separators[i] + diff <= minY) {
      diff = minY - this.separators[i];
    }

    const nextSeparator = i === this.separators.length - 1 ? this.rect.bottom : this.separators[i + 1];
    const maxY = nextSeparator - this.minWindowHeight;
    if (this.separators[i] + diff >= maxY) {
      diff = maxY - this.separators[i];
    }

    if (!this.resized[i]) this.resized[i] = 0;
    this.resized[i] = this.resized[i] + diff;
  };

  reset() {}
}
