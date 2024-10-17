import math from "./math";
import { KWinOutput, KWinVirtualDesktop, KWinWindow } from "./types/kwin";
import { QRect } from "./types/qt";
import { Callbacks } from "./wm";

export interface Tile {
  window: KWinWindow;
  isOnOutput: (output: KWinOutput) => boolean;
  isOnDesktop: (desktop: KWinVirtualDesktop) => boolean;
  remove: () => void;
}

export function tile(window: KWinWindow, callbacks: Callbacks): Tile {
  let move = window.move;
  let resize = window.resize;

  let frameGeometry: QRect;

  function startMove() {}

  function stopMove() {}

  function startResize() {
    resize = true;
    frameGeometry = math.clone(window.frameGeometry);
  }

  function stopResize() {
    callbacks.resizeWindow(window, frameGeometry);
    resize = false;
  }

  function moveResizedChanged() {
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

  function isOnOutput(targetOutput: KWinOutput) {
    return window.output === targetOutput;
  }

  function isOnDesktop(targetDesktop: KWinVirtualDesktop) {
    return window.desktops.findIndex((desktop) => desktop.id === targetDesktop.id) > -1;
  }

  window.moveResizedChanged.connect(moveResizedChanged);

  function remove() {
    window.moveResizedChanged.disconnect(moveResizedChanged);
  }

  return {
    window,
    isOnOutput,
    isOnDesktop,
    remove,
  };
}
