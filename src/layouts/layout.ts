import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";

/*
 * An interface which all tiling layouts should implement
 */

export interface Layout {
  /*
   * Identifier for the layout
   */
  id: string;

  /*
   * Maximum amount of windows the Layout can tile
   */
  limit: number;

  /*
   *  Tiles all windowsOnLayout according to Layout's tiling rules
   *
   *  @param windowsOnLayout - Array of windows that exist on the layout (tile.output and tile.desktops match layout)
   */
  getRects: (windowsOnLayout: Array<KWinWindow>) => void;

  /*
   *  Resizes a windowOnLayout and adjusts the Layout's tiling accordingly
   *
   *  @param windowOnLayout - A window that exists on the layout (window.output and window.desktops match layout)
   *  @param oldRect - Rect of the window when windowStartUserMovedResized was triggered
   */
  resizeWindow: (windowOnLayout: KWinWindow, oldRect: QRect) => void;

  /*
   *  Adjusts the available tiling space of the Layout
   *
   *  @param geometry - Available space for clients (screen area - panels - gaps - margins)
   */
  adjustRect: (rect: QRect) => void;

  /*
   * Restores the layout to its original state
   */
  restore: () => void;
}

export type LayoutFactory = (oi: number, rect: QRect) => Layout;
