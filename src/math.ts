import config from "./config";
import { QRect } from "./types/qt";

function clone(rect: QRect): QRect {
  const { x, y, width, height } = rect;
  return { x, y, width, height };
}

function withGap(rect: QRect): QRect {
  let { x, y, width, height } = rect;

  x += config.gaps;
  y += config.gaps;
  width -= config.gaps * 2;
  height -= config.gaps * 2;

  return { x, y, width, height };
}

function withoutGap(rect: QRect): QRect {
  let { x, y, width, height } = rect;

  x -= config.gaps;
  y -= config.gaps;
  width += config.gaps * 2;
  height += config.gaps * 2;

  return { x, y, width, height };
}

function withMargin(rect: QRect): QRect {
  let { x, y, width, height } = rect;

  y += config.gaps + config.margins.top;
  x += config.gaps + config.margins.left;

  height -= config.gaps * 2 + config.margins.top + config.margins.bottom;
  width -= config.gaps * 2 + config.margins.left + config.margins.right;

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
  clone,
  withGap,
  withoutGap,
  withMargin,
  moveTo,
  centerTo,
  distanceTo,
};
