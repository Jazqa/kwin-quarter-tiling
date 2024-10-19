import { KWinWorkspaceWrapper } from "./types/kwin";

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
