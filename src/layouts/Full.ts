import { overlapsWith, rectClone, rectCombineV, rectDivideV } from "../math";
import { QRect } from "../types/qt";
import { Window } from "../window";
import { Layout } from "../types/layout";
import { Columns } from "./Columns";
import { Rows } from "./Rows";

export class Full implements Layout {
  id: string = "Full";

  rect: QRect;
  limit: number = 0;
  layouts: Array<Layout> = [];

  constructor(rect: QRect) {
    this.rect = rect;

    const layout = new Columns(rect);
    this.addLayout(layout);
  }

  adjustRect = (newRect: QRect) => {};

  addLayout = (layout: Layout) => {
    this.layouts.push(layout);
    this.limit += layout.limit;
  };

  createLayout = (layoutA: Layout) => {
    const rects = rectDivideV(layoutA.rect);

    layoutA.adjustRect(rects[0]);
    const layoutB = new Columns(rects[1]);

    this.addLayout(layoutB);
  };

  removeLayout = () => {
    const length = this.layouts.length;

    const layoutA = this.layouts[length - 2];
    const layoutB = this.layouts.splice(length - 1)[0];

    this.limit -= layoutB.limit;
    layoutA.adjustRect(rectCombineV(layoutA.rect, layoutB.rect));
  };

  tileWindows = (windows: Array<Window>) => {
    const length = this.layouts.length;
    const layoutA = this.layouts[length - 1];

    if (windows.length > this.limit) {
      this.createLayout(layoutA);
    } else if (length > 1 && windows.length <= this.limit - layoutA.limit) {
      this.removeLayout();
    }

    let i = 0;
    this.layouts.forEach((layout) => {
      const j = i + layout.limit;
      const w = windows.slice(i, j);
      layout.tileWindows(w);
      i = j;
    });
  };

  resizeWindow = (window: Window, oldRect: QRect) => {
    this.layouts.forEach((layout) => {
      if (overlapsWith(layout.rect, window.kwin.frameGeometry)) {
        layout.resizeWindow(window, oldRect);
      }
    });
  };

  reset() {}
}
