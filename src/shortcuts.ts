import { increaseGap, decreaseGap } from "./gaps";
import { clientManager } from "./clientManager";

// @ts-ignore, KWin global
const registerShortcut = registerShortcut || function(): void {};

function registerShortcuts(): void {
  registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", clientManager.toggle);
  registerShortcut("Quarter: Increase Gap Size", "Quarter: Increase Gap Size", "Meta+Shift+PgUp", increaseGap);
  registerShortcut("Quarter: Decrease Gap Size", "Quarter: Decrease Gap Size", "Meta+Shift+PgDown", decreaseGap);
}

export const shortcuts = {
  registerShortcuts
};
