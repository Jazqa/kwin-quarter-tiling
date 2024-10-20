import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

export function Disabled(oi: number, rect: QRect): Layout {
  const id = "Disabled";
  const limit = 0;

  function tileWindows(windowsOnLayout: Array<KWinWindow>) {}
  function resizeWindow(windowOnLayout: KWinWindow, oldRect: QRect) {}
  function adjustRect(rect: QRect) {}
  function restore() {}

  return {
    id,
    limit,
    tileWindows,
    resizeWindow,
    adjustRect,
    restore,
  };
}
