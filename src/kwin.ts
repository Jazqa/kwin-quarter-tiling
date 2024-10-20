import { KWinOutput, KWinVirtualDesktop, KWinWorkspaceWrapper } from "./types/kwin";

export const registerUserActionsMenu: (actionsMenu: Object) => void =
  // @ts-ignore, KWin global
  registerUserActionsMenu ||
  function (): void {
    workspace.currentDesktop = workspace.currentDesktop;
  };

export const registerShortcut: (name: string, description: string, key: string, cb: () => void) => void =
  // @ts-ignore, KWin global
  registerShortcut ||
  function (): void {
    workspace.currentDesktop = workspace.currentDesktop;
  };

export const readConfig: (key: string, defaultValue: any) => any =
  // @ts-ignore, KWin global
  readConfig ||
  function (key: string, defaultValue: any) {
    return defaultValue;
  };

export function readConfigString(key: string, defaultValue: any): string {
  return readConfig(key, defaultValue).toString();
}

// @ts-ignore, KWin global
export const workspace: KWinWorkspaceWrapper = workspace || {};

export function maximizeArea(output: KWinOutput, desktop: KWinVirtualDesktop) {
  return workspace.clientArea(2, output, desktop);
}
