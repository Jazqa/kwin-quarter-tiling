import config, { Margin } from "./config";
import { Layout } from "./types/layout";
import { Layouts } from "./layouts";
import { rectMargin } from "./math";
import { KWinOutput } from "./types/kwin";
import { QRect } from "./types/qt";
import { Window } from "./window";
import { WM } from "./wm";

// 2ed6
// Used to fetch configuration values for individual outputs (configuration value format: kcfg_<key>_<index>)
// Unlike proper .qml, the required .ui configuration interface doesn't support detecting outputs, so the configuration interface is hard-coded for up to 4 outputs
export const outputIndex = (kwinOutput: KWinOutput) => {
  let index = workspace.screens.findIndex(({ serialNumber }) => serialNumber === kwinOutput.serialNumber);

  // Theoretically supports more than 4 outputs by defaulting to 1st's configuration
  if (index === -1) {
    index = 0;
  }

  return index;
};

export class Output {
  wm: WM;
  kwin: KWinOutput;

  index: number;

  margin: Margin;
  layout: Layout;

  constructor(wm: WM, kwin: KWinOutput, rect: QRect) {
    this.wm = wm;
    this.kwin = kwin;

    this.index = outputIndex(kwin);

    this.margin = config.margin[this.index];
    this.layout = new Layouts[config.layout[this.index]](rectMargin(rect, this.margin));

    const limit = config.limit[this.index];
    if (limit > -1) {
      this.layout.limit = Math.min(this.layout.limit, limit);
    }
  }

  filterWindows = (windows: Array<Window>) => {
    let i = 0;
    return windows.filter((window) => {
      // Window is disabled
      if (!window.isEnabled()) return false;
      // Window is not on this output
      if (!window.isOnKwinOutput(this.kwin)) return false;

      i += 1;
      return true;
    });
  };

  tileWindows = (windows: Array<Window>) => {
    this.layout.tileWindows(this.filterWindows(windows));
  };

  resizeWindow = (window: Window, oldRect: QRect) => {
    this.layout.resizeWindow(window, oldRect);
  };
}
