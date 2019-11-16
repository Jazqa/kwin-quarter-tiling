import { gaps } from "./gaps";

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clone(geometry: Geometry) {
  const { x, y, width, height } = geometry;
  return { x, y, width, height };
}

function distance(geometryA: Geometry, geometryB: Geometry) {
  return Math.abs(geometryA.x - geometryB.x) + Math.abs(geometryA.y - geometryB.y);
}

function gapArea(geometry: Geometry): Geometry {
  var { x, y, width, height } = geometry;

  x += gaps;
  y += gaps;
  width -= gaps * 2;
  height -= gaps * 2;

  return { x, y, width, height };
}

function freeArea(geometryA: Geometry, geometryB: Geometry) {
  geometryA.width += geometryB.x < geometryA.x ? geometryA.x - geometryB.x : 0;
  geometryA.height += geometryB.y < geometryA.y ? geometryA.y - geometryB.y : 0;

  geometryA.width -= geometryA.x >= geometryA.width ? geometryA.x - geometryA.width : geometryA.x;
  geometryA.height -= geometryA.y >= geometryA.height ? geometryA.y - geometryA.height : geometryA.y;

  return geometryA;
}

export const geometry = {
  clone,
  distance,
  gapArea,
  freeArea
};
