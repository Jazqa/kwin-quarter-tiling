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

export const geometric = {
  clone,
  distance,
  gapArea,
  fullArea
};
