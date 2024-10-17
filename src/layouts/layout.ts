import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";

/*
 * An interface which all tiling layouts should implement
 */

export interface Layout {
  /*
   * Maximum amount of windows the Layout can tile
   */
  maxWindows: number;

  /*
   *  Tiles all windowsOnLayout according to Layout's tiling rules
   *
   *  @param windowsOnLayout - Array of windows on the layout (windowManager.windows filtered by the output and desktop of the layout)
   */
  tileWindows: (windowsOnLayout: Array<KWinWindow>) => void;

  /*
   *  Resizes a clientOnLayout and adjusts the Layout's tiling accordingly
   *
   *  @param windowOnLayout - A window that exists on the layout (client.output and client.desktops match those of the layout)
   *  @param oldRect - Rect of the window when windowStartUserMovedResized was triggered (windowManager.snapshot.rect)
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
