import { gaps } from "./gaps";
import { clientManager } from "./clientManager";
import { workspace } from "./globals";

// @ts-ignore, KWin global
const registerShortcut = registerShortcut || function(): void {};

function registerShortcuts(): void {
  registerShortcut("Quarter: Increase Gap Size", "Quarter: Increase Gap Size", "Meta+Shift+PgUp", () => {
    gaps.increase();
    for (var i = 0; i < workspace.numScreens; i++) {
      clientManager.tileAll(i, workspace.currentDesktop);
    }
  });

  registerShortcut("Quarter: Decrease Gap Size", "Quarter: Decrease Gap Size", "Meta+Shift+PgDown", () => {
    gaps.decrease();
    for (var i = 0; i < workspace.numScreens; i++) {
      clientManager.tileAll(i, workspace.currentDesktop);
    }
  });

  registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", () =>
    clientManager.toggle(workspace.activeClient)
  );
}

export const shortcuts = {
  registerShortcuts
};
