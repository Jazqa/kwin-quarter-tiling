import { maximizeArea } from "./kwin";
import { Output } from "./output";
import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";
import { QRect } from "./types/qt";
import { Window } from "./window";
import { WM } from "./wm";

// 2ed6
// Used to fetch configuration values for individual outputs (configuration value format: kcfg_<key>_<index>)
// Unlike proper .qml, the required .ui configuration interface doesn't support detecting outputs, so the configuration interface is hard-coded for up to 4 outputs
export const kwinOutputIndex = (output: KWinOutput) => {
  let index = workspace.screens.findIndex((wsoutput) => wsoutput.serialNumber === output.serialNumber);

  // Theoretically supports more than 4 outputs by defaulting to 1st's configuration
  if (index === -1) {
    index = 0;
  }

  return index;
};

export const kwinDesktopIndex = (kwinDesktop: KWinVirtualDesktop) => {
  return workspace.desktops.findIndex(({ id }) => id === kwinDesktop.id);
};

export class Desktop {
  wm: WM;
  kwin: KWinVirtualDesktop;
  outputs: Array<Output> = [];

  constructor(wm: WM, kwin: KWinVirtualDesktop) {
    this.wm = wm;
    this.kwin = kwin;
    workspace.screens.forEach(this.addKwinOutput);
  }

  addKwinOutput = (kwinOutput: KWinOutput) => {
    // 04c1
    // Desktop is already initialized
    if (this.outputs.some((output) => output.kwin.serialNumber === kwinOutput.serialNumber)) return;

    const rect = maximizeArea(kwinOutput, this.kwin);
    const output = new Output(this.wm, kwinOutput, rect);
    this.outputs.push(output);
  };

  filterWindows = (windows: Array<Window>) => {
    return windows.filter((window) => {
      // Window is disabled
      if (!window.isEnabled()) return false;
      // Window is not on this desktop
      if (!window.isOnKwinDesktop(this.kwin)) return false;
      return true;
    });
  };

  tileWindows = (windows: Array<Window>) => {
    this.outputs.forEach((output) => output.tileWindows(this.filterWindows(windows)));
  };

  resizeWindow = (window: Window, oldRect: QRect) => {
    const output = this.outputs.find((output) => output.kwin.serialNumber === window.kwin.output.serialNumber);
    output.resizeWindow(window, oldRect);
  };
}
