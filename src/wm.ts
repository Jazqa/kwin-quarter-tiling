import config from "./config";
import { Desktop, kwinDesktopIndex } from "./desktop";
import * as math from "./math";
import { KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { Window } from "./window";

export class WM {
  tiling: boolean = false;
  desktops: Array<Desktop> = [];
  windows: Array<Window> = [];

  isTiling() {
    return this.tiling;
  }

  constructor() {
    workspace.desktops.forEach(this.addKwinDesktop);
    workspace.stackingOrder.forEach(this.addKwinWindow);

    workspace.currentDesktopChanged.connect(this.tileWindows);
    workspace.windowAdded.connect(this.addKwinWindow);
    workspace.windowRemoved.connect(this.removeKwinWindow);
    workspace.windowActivated.connect(this.tileWindows);

    registerShortcut("(YAKTS) Tile Window", "", "Meta+F", this.toggleActiveWindow);
    registerUserActionsMenu(this.actionsMenu);
  }

  // KWin Actions
  actionsMenu = (kwinWindow: KWinWindow) => {
    const window = this.windows.find((window) => window.kwin.internalId === kwinWindow.internalId);
    if (window) {
      return {
        text: "Tile Window",
        checkable: true,
        checked: window.isEnabled(),
        triggered: () => {
          this.toggleWindow(window);
        },
      };
    }
  };

  // KWin Desktops
  addKwinDesktop = (kwinDesktop: KWinVirtualDesktop) => {
    // Desktop is excluded
    if (config.desktops.indexOf(kwinDesktopIndex(kwinDesktop))) return;

    // Desktop is already initialized
    if (this.desktops.some((desktop) => desktop.kwin.id === kwinDesktop.id)) return;

    const desktop = new Desktop(this, kwinDesktop);
    this.desktops.push(desktop);
  };

  // KWin Windows
  addKwinWindow = (kwinWindow: KWinWindow) => {
    if (this.isKwinWindowAllowed(kwinWindow)) {
      const window = new Window(this, kwinWindow);
      this.windows.push(window);
      this.tileWindows();
    }
  };

  removeKwinWindow = (kwinWindow: KWinWindow) => {
    const index = this.windows.findIndex((window) => window.kwin.internalId === kwinWindow.internalId);
    const window = this.windows[index];

    if (index > -1) {
      window.deconstruct();
      this.windows.splice(index, 1);
      this.tileWindows();
    }
  };

  isKwinWindowAllowed = (window: KWinWindow) => {
    return (
      window.managed &&
      window.normalWindow &&
      window.moveable &&
      window.resizeable &&
      window.rect.width >= config.minWidth &&
      window.rect.height >= config.minHeight &&
      config.processes.indexOf(window.resourceClass.toString().toLowerCase()) === -1 &&
      config.processes.indexOf(window.resourceName.toString().toLowerCase()) === -1 &&
      !config.captions.some((caption) => window.caption.toLowerCase().includes(caption.toLowerCase()))
    );
  };

  // Windows
  filterWindows = () => {
    return this.windows.filter((window) => window.isEnabled());
  };

  tileWindows = () => {
    if (this.tiling) return;

    this.tiling = true;

    this.desktops.forEach((desktop) => {
      if (desktop.kwin.id === workspace.currentDesktop.id) {
        desktop.tileWindows(this.filterWindows());
      }
    });

    this.tiling = false;
  };

  swapWindows = (i: number, j: number) => {
    const window: Window = this.windows[i];
    this.windows[i] = this.windows[j];
    this.windows[j] = window;
  };

  moveWindow = (window: Window, oldRect: QRect) => {
    let nearestWindow = this.windows.find(({ kwin }) => kwin.internalId === window.kwin.internalId);
    let nearestDistance = math.distanceTo(window.kwin.frameGeometry, oldRect);

    this.windows.forEach(({ kwin }, index) => {
      if (kwin.internalId !== window.kwin.internalId) {
        const distance = math.distanceTo(kwin.frameGeometry, window.kwin.frameGeometry);
        if (distance < nearestDistance) {
          nearestWindow = this.windows[index];
          nearestDistance = distance;
        }
      }
    });

    const i = this.windows.findIndex(({ kwin }) => kwin.internalId === window.kwin.internalId);
    const j = this.windows.findIndex(({ kwin }) => kwin.internalId === nearestWindow.kwin.internalId);

    if (i !== j) {
      this.swapWindows(i, j);
    }

    this.tileWindows();
  };

  resizeWindow = (window: Window, oldRect: QRect) => {
    const desktop = this.desktops.find((desktop) => desktop.kwin.id === window.kwin.desktops[0].id);
    if (!desktop) return;

    desktop.resizeWindow(window, oldRect);
    this.tileWindows();
  };

  tileWindow = (window: Window) => {
    this.tileWindows();
  };

  pushWindow = (window: Window) => {
    const index = this.windows.findIndex(({ kwin }) => kwin.internalId === window.kwin.internalId);

    if (index > -1) {
      const window = this.windows[index];
      this.windows.splice(index, 1);
      this.windows.push(window);
    }

    this.tileWindows();
  };

  toggleActiveWindow = () => {
    const window = this.windows.find(({ kwin }) => kwin.internalId === workspace.activeWindow.internalId);
    this.toggleWindow(window);
  };

  toggleWindow = (window: Window) => {
    if (window.isEnabled()) {
      window.disable(true);
      this.tileWindows();
      workspace.activeWindow = window.kwin;
    } else {
      window.enable(true);
      this.pushWindow(window);
    }
  };
}
