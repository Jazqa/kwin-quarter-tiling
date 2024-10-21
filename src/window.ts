import config from "./config";
import { maximizeArea } from "./kwin";
import { rectCenterTo, rectClone, rectGap } from "./math";
import { outputIndex } from "./output";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { WM } from "./wm";

export class Window {
  wm: WM;
  kwin: KWinWindow;

  // Enabled  can      be changed manually by the user or automatically by the script
  // Disabled can only be changed                         automatically by the script
  // In practice, disabled = true tiles can be re-enabled automatically by the script, but disabled = false tiles can only be re-enabled manually by the user
  enabled: boolean = true;
  disabled: boolean = false;

  kwinOutput: KWinOutput;
  kwinDesktops: Array<KWinVirtualDesktop>;

  move: boolean;
  resize: boolean;

  isKeyboard: boolean;

  originalGeometry: QRect;
  oldGeometry: QRect;
  oldGeometryKeyboard: QRect | undefined;

  isEnabled = () => {
    return this.enabled;
  };

  isDisabled = () => {
    return !this.enabled;
  };

  isAutoTilingEnabled = () => {
    return config.auto[outputIndex(this.kwin.output)];
  };

  isDisabledByDefault = () => {
    return !this.isAutoTilingEnabled() || this.kwin.minimized || this.kwin.fullScreen || this.isMaximized();
  };

  isOnKwinOutput = (kwinOutput: KWinOutput) => {
    return this.kwin.output.serialNumber === kwinOutput.serialNumber;
  };

  // cf3f
  isOnKwinDesktop = (kwinDesktop: KWinVirtualDesktop) => {
    return this.kwin.desktops.length === 1 && this.kwin.desktops[0].id === kwinDesktop.id;
  };

  constructor(wm: WM, kwin: KWinWindow) {
    this.wm = wm;
    this.kwin = kwin;

    this.kwin.moveResizedChanged.connect(this.moveResizedChanged);
    this.kwin.outputChanged.connect(this.outputChanged);
    this.kwin.desktopsChanged.connect(this.desktopsChanged);
    this.kwin.maximizedChanged.connect(this.maximizedChanged);
    this.kwin.minimizedChanged.connect(this.minimizedChanged);
    this.kwin.fullScreenChanged.connect(this.fullScreenChanged);
    this.kwin.frameGeometryChanged.connect(this.frameGeometryChanged);
    this.kwin.frameGeometryAboutToChange.connect(this.frameGeometryAboutToChange);

    if (this.isDisabledByDefault()) {
      this.disable();
    }
  }

  deconstruct = () => {
    this.kwin.moveResizedChanged.disconnect(this.moveResizedChanged);
    this.kwin.outputChanged.disconnect(this.outputChanged);
    this.kwin.desktopsChanged.disconnect(this.desktopsChanged);
    this.kwin.maximizedChanged.disconnect(this.maximizedChanged);
    this.kwin.fullScreenChanged.disconnect(this.fullScreenChanged);
    this.kwin.frameGeometryChanged.disconnect(this.frameGeometryChanged);
    this.kwin.frameGeometryAboutToChange.disconnect(this.frameGeometryAboutToChange);
  };

  // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
  // @param capture - Inciates whether the window's frameGeometry should be used as its originalGeometry when restored later
  enable = (manual?: boolean, capture?: boolean) => {
    if (manual || (this.disabled && this.isAutoTilingEnabled())) {
      this.disabled = false;
      this.enabled = true;

      if (capture) {
        this.originalGeometry = rectClone(this.kwin.frameGeometry);
      }
    }
  };

  // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
  // @param restore - Indicates the window's frameGeometry should be restored to its original rect
  disable = (manual?: boolean, restore?: boolean) => {
    if (!manual) this.disabled = true;
    this.enabled = false;

    if (restore) {
      this.kwin.frameGeometry = rectCenterTo(this.originalGeometry, this.kwin.output.geometry);
      workspace.activeWindow = this.kwin;
    }
  };

  // b43a
  setFrameGeometry = (rect: QRect) => {
    rect = rectGap(rect, config.gap[outputIndex(this.kwin.output)]);

    if (rect.width < this.kwin.minSize.width) {
      rect.width = this.kwin.minSize.width;
    }

    if (rect.height < this.kwin.minSize.height) {
      rect.height = this.kwin.minSize.height;
    }

    this.kwin.frameGeometry = rect;

    this.oldGeometryKeyboard = undefined;
  };

  startMove = (oldRect: QRect) => {
    this.move = true;
    this.oldGeometry = rectClone(oldRect);
  };

  stopMove = () => {
    if (this.kwinOutput !== this.kwin.output) {
      this.outputChanged(true);
    } else if (this.enabled) {
      this.wm.moveWindow(this, this.oldGeometry);
    }

    this.move = false;
  };

  startResize = (oldRect: QRect) => {
    this.resize = true;
    this.oldGeometry = rectClone(oldRect);
  };

  stopResize = () => {
    this.wm.resizeWindow(this, this.oldGeometry);
    this.resize = false;
  };

  moveResizedChanged = () => {
    if (this.kwin.move && !this.move) {
      this.startMove(this.kwin.frameGeometry);
    } else if (!this.kwin.move && this.move) {
      this.stopMove();
    } else if (!this.enabled) {
      return;
    } else if (this.kwin.resize && !this.resize) {
      this.startResize(this.kwin.frameGeometry);
    } else if (!this.kwin.resize && this.resize) {
      this.stopResize();
    }
  };

  // frameGeometryAboutToChange and frameGeometryChanged are used only for moving windows via KWin's default shortcuts
  // _isKeyboard and _oldGeometryKeyboard are used to identify signals triggered by the shortcut
  frameGeometryAboutToChange = () => {
    if (!this.wm.isTiling() && !this.kwin.move && !this.kwin.resize && !this.move && !this.resize) {
      this.isKeyboard = true;
    }
  };
  frameGeometryChanged = (oldRect: QRect) => {
    if (!this.wm.isTiling() && this.kwin.move && this.kwin.resize && !this.move && !this.resize && this.isKeyboard) {
      if (this.oldGeometryKeyboard) {
        this.startMove(this.oldGeometryKeyboard);
        this.stopMove();
        this.oldGeometryKeyboard = undefined;
      } else {
        this.oldGeometryKeyboard = oldRect;
      }

      this.isKeyboard = false;
    }
  };

  fullScreenChanged = () => {
    if (this.kwin.fullScreen) {
      this.disable();
    } else {
      this.enable();
    }

    this.wm.tileWindow(this);
  };

  maximizedChanged = () => {
    if (this.kwin.fullScreen) return;

    if (this.isMaximized()) {
      this.disable();
    } else {
      this.enable();
    }

    this.wm.tileWindow(this);
  };

  minimizedChanged = () => {
    if (this.kwin.minimized) {
      this.disable();
    } else {
      this.enable();
    }

    this.wm.pushWindow(this);
  };

  isMaximized = () => {
    const desktop = this.kwin.desktops[0] || workspace.desktops[0];
    const area = maximizeArea(this.kwin.output, desktop);

    const h = this.kwin.frameGeometry.width === area.width && this.kwin.frameGeometry.x === area.x;
    const v = this.kwin.frameGeometry.height === area.height && this.kwin.frameGeometry.y === area.y;

    if (h || v) {
      return true;
    }
  };

  // @param force - Ignores the move check (used to ignore outputChanged signal if moveResizedChanged might do the same later)
  outputChanged = (force?: boolean) => {
    if (force || !this.move) {
      this.kwinOutput = this.kwin.output;

      if (this.isAutoTilingEnabled()) {
        this.enable();
      } else {
        this.disable();
      }

      this.wm.pushWindow(this);
    }
  };

  // cf3f
  desktopsChanged = () => {
    if (this.kwin.desktops.length > 1) {
      this.disable();
    } else if (this.kwin.desktops.length === 1) {
      this.enable();
    }

    this.kwinDesktops = this.kwin.desktops;
    this.wm.pushWindow(this);
  };
}
