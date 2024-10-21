import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";

export function readConfigString(key: string, defaultValue: any): string {
  return readConfig(key, defaultValue).toString();
}

export function maximizeArea(output: KWinOutput, desktop: KWinVirtualDesktop) {
  return workspace.clientArea(2, output, desktop);
}
