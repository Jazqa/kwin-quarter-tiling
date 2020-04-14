import { gaps } from "./gaps";

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = "top" | "left" | "bottom" | "right";

function clone(geometry: Geometry) {
  const { x, y, width, height } = geometry;
  return { x, y, width, height };
}

function distance(geometryA: Geometry, geometryB: Geometry) {
  return Math.abs(geometryA.x - geometryB.x) + Math.abs(geometryA.y - geometryB.y);
}

function gapArea(geometry: Geometry): Geometry {
  const { size } = gaps;
  var { x, y, width, height } = geometry;

  x += size;
  y += size;
  width -= size * 2;
  height -= size * 2;

  return { x, y, width, height };
}

function fullArea(geometry: Geometry): Geometry {
  const { size } = gaps;
  var { x, y, width, height } = geometry;

  x -= size;
  y -= size;
  width += size * 2;
  height += size * 2;

  return { x, y, width, height };
}

function moveTo(geometryA: Geometry, geometryB: Geometry) {
  const geometryC = clone(geometryB);
  geometryC.height = geometryA.height;
  geometryC.width = geometryA.width;
  return geometryC;
}

function center(geometryA: Geometry, geometryB: Geometry) {
  geometryB.x += geometryB.width * 0.5 - geometryA.width * 0.5;
  geometryB.y += geometryB.height * 0.5 - geometryA.height * 0.5;
  return moveTo(geometryA, geometryB);
}

export const geometryUtils = {
  clone,
  distance,
  gapArea,
  fullArea,
  moveTo,
  center
};
