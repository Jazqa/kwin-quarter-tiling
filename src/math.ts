import config from "./config";
import { workspace } from "./kwin";
import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";
import { QRect } from "./types/qt";

// 2ed6
// Used to fetch configuration values for individual outputs (configuration value format: kcfg_<key>_<index>)
// Unlike proper .qml, the required .ui configuration interface doesn't support detecting outputs, so the configuration interface is hard-coded for up to 4 outputs
function kcfgOutputIndex(output: KWinOutput) {
  let index = workspace.screens.findIndex((wsoutput) => wsoutput.serialNumber === output.serialNumber);

  // Theoretically supports more than 4 outputs by defaulting to 1st's configuration
  if (index === -1) {
    index = 0;
  }

  return index;
}

function outputIndex(output: KWinOutput) {
  return workspace.screens.findIndex((wsoutput) => wsoutput.serialNumber === output.serialNumber);
}

function desktopIndex(desktop: KWinVirtualDesktop) {
  return workspace.desktops.findIndex((wsdesktop) => wsdesktop.id === desktop.id);
}

function clone(rect: QRect): QRect {
  const { x, y, width, height } = rect;
  return { x, y, width, height };
}

function withGap(oi: number, rect: QRect): QRect {
  const gap = config.gap[oi];
  let { x, y, width, height } = rect;

  x += gap;
  y += gap;
  width -= gap * 2;
  height -= gap * 2;

  return { x, y, width, height };
}

function withoutGap(oi: number, rect: QRect): QRect {
  const gap = config.gap[oi];
  let { x, y, width, height } = rect;

  x -= gap;
  y -= gap;
  width += gap * 2;
  height += gap * 2;

  return { x, y, width, height };
}

function withMargin(oi: number, rect: QRect): QRect {
  const gap = config.gap[oi];
  const margin = config.margin[oi];

  let { x, y, width, height } = rect;

  y += gap + margin.top;
  x += gap + margin.left;

  height -= gap * 2 + margin.top + margin.bottom;
  width -= gap * 2 + margin.left + margin.right;

  return { x, y, width, height };
}

function centerTo(rectA: QRect, rectB: QRect) {
  let { x, y, width, height } = rectA;

  x = rectB.width * 0.5 - rectA.width * 0.5;
  y = rectB.height * 0.5 - rectA.height * 0.5;

  return { x, y, width, height };
}

function distanceTo(rectA: QRect, rectB: QRect) {
  return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
}

export default {
  kcfgOutputIndex,
  outputIndex,
  desktopIndex,
  clone,
  withGap,
  withoutGap,
  withMargin,
  centerTo,
  distanceTo,
};
