import config from "./config";
import { workspace } from "./kwin";
import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";
import { QRect } from "./types/qt";

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

function moveTo(rectA: QRect, rectB: QRect) {
  const rectC = clone(rectB);
  rectC.height = rectA.height;
  rectC.width = rectA.width;
  return rectC;
}

function centerTo(rectA: QRect, rectB: QRect) {
  rectB.x += rectB.width * 0.5 - rectA.width * 0.5;
  rectB.y += rectB.height * 0.5 - rectA.height * 0.5;
  return moveTo(rectA, rectB);
}

function distanceTo(rectA: QRect, rectB: QRect) {
  return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
}

export default {
  outputIndex,
  desktopIndex,
  clone,
  withGap,
  withoutGap,
  withMargin,
  moveTo,
  centerTo,
  distanceTo,
};
