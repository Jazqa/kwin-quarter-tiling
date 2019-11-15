// @flow
import { kwReadConfig, kwRegisterShortcut } from "./kwGlobals";
import type { KWGeometry } from "./kwTypes";

export var gaps = kwReadConfig("gaps", 8);

export const adjustGaps = (amount: number) => {
  // Note: Gap size can't be zero, because it would screw up the maximized window logic
  const minGaps = 2;
  const maxGaps = 64;

  gaps = Math.min(Math.max(gaps + amount, minGaps), maxGaps);
};

const increaseGap = () => {
  adjustGaps(2);
};

const decreaseGap = () => {
  adjustGaps(-2);
};

const registerShortcuts = () => {
  kwRegisterShortcut("Quarter: Increase Gap Size", "Quarter: Increase Gap Size", "Meta+Shift+PgUp", increaseGap);
  kwRegisterShortcut("Quarter: Decrease Gap Size", "Quarter: Decrease Gap Size", "Meta+Shift+PgDown", decreaseGap);
};

export const withGaps = (geometry: KWGeometry): KWGeometry => {
  var { x, y, width, height } = geometry;

  x += gaps;
  y += gaps;
  width -= gaps * 2;
  height -= gaps * 2;

  return { x, y, width, height };
};

registerShortcuts();
