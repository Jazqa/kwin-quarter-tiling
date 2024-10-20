import { maximizeArea, workspace } from "./kwin";
import math from "./math";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { Callbacks } from "./wm";

export interface Tile {
  window: KWinWindow;
  isEnabled: () => boolean;
  enable: (manual?: boolean) => void;
  disable: (manual?: boolean) => void;
  isOnOutput: (output: KWinOutput) => boolean;
  isOnDesktop: (desktop: KWinVirtualDesktop) => boolean;
  remove: () => void;
}

export function tile(window: KWinWindow, callbacks: Callbacks): Tile {
  // Enabled  can      be changed manually by the user or automatically by the script
  // Disabled can only be changed                         automatically by the script
  // In practice, disabled = true tiles can be re-enabled automatically by the script, but disabled = false tiles can only be re-enabled manually by the user
  let _enabled = true;
  let _disabled = false;

  let _output = window.output;
  let _desktops = window.desktops;

  let _move = window.move;
  let _resize = window.resize;

  let _originalGeometry = math.clone(window.frameGeometry);
  let _oldGeometry: QRect;

  if (window.minimized || window.fullScreen || isMaximized()) {
    disable();
  }

  function isEnabled() {
    return _enabled;
  }

  // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
  // @param capture - Inciates whether the window's frameGeometry should be used as its originalGeometry when restored later
  function enable(manual?: boolean, capture?: boolean) {
    if (manual || _disabled) {
      _disabled = false;
      _enabled = true;

      if (capture) {
        _originalGeometry = math.clone(window.frameGeometry);
      }
    }
  }

  // @param manual  - Indicates whether the action was performed manually by the user or automatically by the script
  // @param restore - Indicates the window's frameGeometry should be restored to its original rect
  function disable(manual?: boolean, restore?: boolean) {
    if (!manual) _disabled = true;
    _enabled = false;

    if (restore) {
      window.frameGeometry.width = _originalGeometry.width;
      window.frameGeometry.height = _originalGeometry.height;
    }
  }

  function startMove() {
    _move = true;
    _oldGeometry = math.clone(window.frameGeometry);
  }

  function stopMove() {
    if (_output !== window.output) {
      outputChanged(true);
    } else if (_enabled) {
      callbacks.moveWindow(window, _oldGeometry);
    }

    _move = false;
  }

  function startResize() {
    _resize = true;
    _oldGeometry = math.clone(window.frameGeometry);
  }

  function stopResize() {
    callbacks.resizeWindow(window, _oldGeometry);
    _resize = false;
  }

  function moveResizedChanged() {
    if (window.move && !_move) {
      startMove();
    } else if (!window.move && _move) {
      stopMove();
    }

    if (!_enabled) return;

    if (window.resize && !_resize) {
      startResize();
    } else if (!window.resize && _resize) {
      stopResize();
    }
  }

  function fullScreenChanged() {
    if (window.fullScreen) {
      disable();
    } else {
      enable();
    }

    callbacks.enableWindow(window);
  }

  function maximizedChanged() {
    if (window.fullScreen) return;

    if (isMaximized()) {
      disable();
    } else {
      enable();
    }

    callbacks.enableWindow(window);
  }

  function minimizedChanged() {
    if (window.minimized) {
      disable();
    } else {
      enable();
    }

    callbacks.pushWindow(window);
  }

  function isMaximized() {
    const desktop = _desktops[0] || window.desktops[0] || workspace.desktops[0];
    const area = maximizeArea(_output, desktop);

    const h = window.frameGeometry.width === area.width && window.frameGeometry.x === area.x;
    const v = window.frameGeometry.height === area.height && window.frameGeometry.y === area.y;

    if (h || v) {
      return true;
    }
  }

  // @param force - Ignores the move check (used to ignore outputChanged signal if moveResizedChanged might do the same later)
  function outputChanged(force?: boolean) {
    if (force || !_move) {
      _output = window.output;
      enable();
      callbacks.pushWindow(window);
    }
  }

  function isOnOutput(output: KWinOutput) {
    return window.output.serialNumber === output.serialNumber;
  }

  // cf3f
  function desktopsChanged() {
    if (window.desktops.length > 1) {
      disable();
    } else if (window.desktops.length === 1) {
      enable();
    }

    _desktops = window.desktops;
    callbacks.pushWindow(window);
  }

  // cf3f
  function isOnDesktop(desktop: KWinVirtualDesktop) {
    return window.desktops.length === 1 && window.desktops[0].id === desktop.id;
  }

  // Constructor
  window.moveResizedChanged.connect(moveResizedChanged);
  window.outputChanged.connect(outputChanged);
  window.desktopsChanged.connect(desktopsChanged);
  window.maximizedChanged.connect(maximizedChanged);
  window.minimizedChanged.connect(minimizedChanged);
  window.fullScreenChanged.connect(fullScreenChanged);

  function remove() {
    window.moveResizedChanged.disconnect(moveResizedChanged);
    window.outputChanged.disconnect(outputChanged);
    window.desktopsChanged.disconnect(desktopsChanged);
    window.maximizedChanged.disconnect(maximizedChanged);
    window.fullScreenChanged.disconnect(fullScreenChanged);
  }

  return {
    window,
    isEnabled,
    enable,
    disable,
    isOnOutput,
    isOnDesktop,
    remove,
  };
}
