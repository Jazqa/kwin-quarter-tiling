import { gaps } from "./gaps";
import { clientManager } from "./clientManager";
import { workspace } from "./globals";

const registerShortcut: (name: string, description: string, key: string, cb: () => void) => void =
  // @ts-ignore, KWin global
  registerShortcut ||
  function(): void {
    // This is never called
    // Exists as a dumb workaround to make this file have a "side-effect" on the project and be included in rollup
    workspace.currentDesktop = workspace.currentDesktop;
  };

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
