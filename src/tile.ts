import { workspace } from "./kwin";
import math from "./math";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { Callbacks } from "./wm";

export interface Tile {
  enabled: boolean;
  window: KWinWindow;
  isOnOutput: (output: KWinOutput) => boolean;
  isOnDesktop: (desktop: KWinVirtualDesktop) => boolean;
  remove: () => void;
}

export function tile(window: KWinWindow, callbacks: Callbacks): Tile {
  let enabled = true;

  let output = window.output;

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

  function isOnOutput(targetOutput: KWinOutput) {
    return window.output === targetOutput;
  }

  function isOnDesktop(targetDesktop: KWinVirtualDesktop) {
    return window.desktops.findIndex((desktop) => desktop.id === targetDesktop.id) > -1;
  }

  window.moveResizedChanged.connect(moveResizedChanged);
  window.outputChanged.connect(outputChanged);

  function remove() {
    window.moveResizedChanged.disconnect(moveResizedChanged);
  }

  return {
    enabled,
    window,
    isOnOutput,
    isOnDesktop,
    remove,
  };
}
