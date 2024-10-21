import { Edge } from "../math";
import { Window } from "../window";
import { QEdge, QRect } from "./qt";

/*
 * An interface which all tiling layouts should implement
 */

export interface Layout {
  /*
   * Identifier for the Layout
   */
  id: string;

  /*
   * QRect of the Layout
   */
  rect: QRect;

  /*
   * Maximum amount of windows the Layout can tile
   */
  limit: number;

  /*
   *  Tiles all windows according to Layout's tiling rules
   *
   *  @param windows  - Array of windows that exist on the layout
   *  @param gap      - Amount of space to add around windows
   */
  tileWindows: (windows: Array<Window>) => void;

  /*
   *  Resizes a window and adjusts the Layout's tiles accordingly
   *
   *  @param window   - The window that was resized
   *  @param oldRect  - QRect of the window when windowStartUserMovedResized was triggered
   */
  resizeWindow: (window: Window, oldRect: QRect) => Edge | void;

  /*
   *  Adjusts the available tiling space of the Layout
   *
   *  @param rect     - QRect of the Layout
   */
  adjustRect: (rect: QRect) => void;

  /*
   * Resets the layout to its original state
   */
  reset: () => void;
}
