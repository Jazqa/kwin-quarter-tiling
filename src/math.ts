import { Margin } from "./config";
import { QRect } from "./types/qt";

export const rectClone = (rect: QRect): QRect => {
  const { x, y, width, height, left, top, bottom, right } = rect;
  return { x, y, width, height, left, top, bottom, right };
};

export const rectCombineV = (rectA: QRect, rectB): QRect => {
  const rect = rectClone(rectA);

  rect.y = Math.min(rectA.y, rectB.y);
  rect.height = rectA.height + rectB.height;
  rect.top = Math.min(rectA.top, rectB.top);
  rect.bottom = Math.max(rectA.bottom, rectB.bottom);

  return rect;
};

export const rectDivideV = (rect: QRect): Array<QRect> => {
  const rectA = rectClone(rect);

  rectA.height *= 0.5;

  const rectB = rectClone(rectA);

  rectA.bottom = rectA.y + rectA.height;

  rectB.y = rectA.bottom;
  rectB.top = rectA.bottom;

  return [rectA, rectB];
};

export const rectGap = (rect: QRect, gap: number): QRect => {
  let { x, y, width, height, left, top, bottom, right } = rect;

  x += gap;
  y += gap;
  width -= gap * 2;
  height -= gap * 2;

  left += gap;
  top += gap;
  bottom -= gap;
  right -= gap;

  return { x, y, width, height, left, top, bottom, right };
};

export const rectMargin = (rect: QRect, margin: Margin): QRect => {
  let { x, y, width, height, left, top, bottom, right } = rect;

  x += margin.left;
  y += margin.top;
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;

  left += margin.left;
  top += margin.top;
  bottom -= margin.bottom;
  right -= margin.right;

  return { x, y, width, height, left, top, bottom, right };
};

export const rectCenterTo = (rectA: QRect, rectB: QRect): QRect => {
  let { x, y, width, height, left, top, bottom, right } = rectA;

  x = rectB.right * 0.5 - width * 0.5;
  y = rectB.bottom * 0.5 - height * 0.5;
  left = x;
  top = y;
  bottom = y + height;
  right = x + width;

  return { x, y, width, height, left, top, bottom, right };
};

export const distanceTo = (rectA: QRect, rectB: QRect): number => {
  return Math.abs(rectA.x - rectB.x) + Math.abs(rectA.y - rectB.y);
};

const inRange = (value: number, min: number, max: number) => {
  return value >= min && value <= max;
};

export const overlapsWith = (rectA: QRect, rectB: QRect): boolean => {
  const x = inRange(rectA.x, rectB.x, rectB.x + rectB.width) || inRange(rectB.x, rectA.x, rectA.x + rectA.width);
  const y = inRange(rectA.y, rectB.y, rectB.y + rectB.height) || inRange(rectB.y, rectA.y, rectA.y + rectA.height);
  return x && y;
};
