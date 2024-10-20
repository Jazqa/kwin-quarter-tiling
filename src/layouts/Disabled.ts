import { Tile } from "../tile";
import { KWinWindow } from "../types/kwin";
import { QRect } from "../types/qt";
import { Layout } from "./layout";

export function Disabled(oi: number, rect: QRect): Layout {
  const id = "Disabled";
  const limit = 0;

  function getRects(windows: Array<KWinWindow>) {}
  function resizeWindow(windows: KWinWindow, oldRect: QRect) {}
  function adjustRect(rect: QRect) {}
  function restore() {}

  return {
    id,
    limit,
    getRects,
    resizeWindow,
    adjustRect,
    restore,
  };
}
