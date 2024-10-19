import { workspace } from "./kwin";
import math from "./math";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { Callbacks } from "./wm";

export interface Tile {
  enabled: boolean;
  window: KWinWindow;
  hardEnable: () => void;
  softEnable: () => void;
  hardDisable: () => void;
  softDisable: () => void;
  isOnOutput: (output: KWinOutput) => boolean;
  isOnDesktop: (desktop: KWinVirtualDesktop) => boolean;
  remove: () => void;
}

export function tile(window: KWinWindow, callbacks: Callbacks): Tile {
  // Enabled  can      be changed manually by the user or automatically by the script
  // Disabled can only be changed                         automatically by the script
  // In practice, disabled = true tiles can be re-enabled automatically by the script, but disabled = false tiles can only be re-enabled manually by the user
  let enabled = true;
  let disabled = false;

  function hardEnable() {
    enabled = true;
    disabled = false;
  }

  function softEnable() {
    if (disabled) {
      enabled = true;
      disabled = false;
    }
  }

  function hardDisable() {
    enabled = false;
  }

  function softDisable() {
    enabled = false;
    disabled = true;
  }

  let output = window.output;
  let desktops = window.desktops;

  let move = window.move;
  let resize = window.resize;

  let originalGeometry = math.clone(window.frameGeometry);
  let frameGeometry: QRect;

  function startMove() {
    move = true;
    frameGeometry = math.clone(window.frameGeometry);
  }

  function stopMove() {
    if (output !== window.output) {
      outputChanged(true);
    } else {
      callbacks.moveWindow(window, frameGeometry);
    }

    move = false;
  }

  function startResize() {
    resize = true;
    frameGeometry = math.clone(window.frameGeometry);
  }

  function stopResize() {
    callbacks.resizeWindow(window, frameGeometry);
    resize = false;
  }

  function moveResizedChanged() {
    if (!enabled) return;

    if (window.move && !move) {
      startMove();
    } else if (!window.move && move) {
      stopMove();
    }

    if (window.resize && !resize) {
      startResize();
    } else if (!window.resize && resize) {
      stopResize();
    }
  }

  // @param force - Ignores the move check (used to ignore outputChanged signal if moveResizedChanged might do the same later)
  function outputChanged(force?: boolean) {
    if (force || !move) {
      output = window.output;
      callbacks.pushWindow(window);
    }
  }

  function isOnOutput(output: KWinOutput) {
    return window.output.serialNumber === output.serialNumber;
  }

  // cf3f
  function desktopsChanged() {
    if (desktops.length > 1) {
      softDisable();
    } else if (desktops.length === 1) {
      softEnable();
    }

    desktops = window.desktops;
    callbacks.pushWindow(window);
  }

  // cf3f
  function isOnDesktop(desktop: KWinVirtualDesktop) {
    return window.desktops.length === 1 && window.desktops[0].id === desktop.id;
  }

  window.moveResizedChanged.connect(moveResizedChanged);
  window.outputChanged.connect(outputChanged);
  window.desktopsChanged.connect(desktopsChanged);

  function remove() {
    window.moveResizedChanged.disconnect(moveResizedChanged);
    window.outputChanged.disconnect(outputChanged);
    window.desktopsChanged.disconnect(desktopsChanged);
  }

  return {
    enabled,
    window,
    hardEnable,
    softEnable,
    hardDisable,
    softDisable,
    isOnOutput,
    isOnDesktop,
    remove,
  };
}
