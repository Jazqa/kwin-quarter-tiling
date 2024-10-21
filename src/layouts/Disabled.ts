import { rectClone } from "../math";
import { QRect } from "../types/qt";
import { Window } from "../window";
import { Layout } from "../types/layout";

export class Disabled implements Layout {
  id: string = "Disabled";

  rect: QRect;
  limit: number = 0;

  adjustRect = (newRect: QRect) => {};

  tileWindows = (windows: Array<Window>) => {};

  resizeWindow = (window: Window, oldRect: QRect) => {};

  reset() {}
}
