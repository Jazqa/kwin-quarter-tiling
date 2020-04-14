import { Client } from "../client";
import { Geometry, geometryUtils } from "../geometry";
import { Layout } from "../layout";

interface Separators {
  v: Array<number>;
  h: number;
}

interface QuarterVerticalLayout extends Layout {
  geometry: Geometry;
  separators: Separators;
}

function getTiles(geometry: Geometry, separators: Separators, count: number): Array<Geometry> {
  const { x, y, width, height } = geometry;
  const { v, h } = separators;

  const tiles = [
    {
      x,
      y,
      width: v[0] - x,
      height: h - y,
    },
    {
      x,
      y: h,
      width: v[1] - x,
      height: y + height - h,
    },
    {
      x: v[1],
      y: h,
      width: x + width - v[1],
      height: y + height - h,
    },
    {
      x: v[0],
      y,
      width: x + width - v[0],
      height: h - y,
    },
  ];

  if (count < 4) {
    tiles[0].width = tiles[3].x + tiles[3].width - tiles[0].x;
  }

  if (count < 3) {
    tiles[1].width = tiles[2].x + tiles[2].width - tiles[1].x;
  }

  if (count < 2) {
    tiles[0].height = tiles[1].y + tiles[1].height - tiles[0].y;
  }

  return tiles;
}

export function QuarterVertical(geometry: Geometry): QuarterVerticalLayout {
  const maxClients = 4;

  let hs = geometry.y + geometry.height * 0.5;
  let vs = geometry.x + geometry.width * 0.5;
  let separators = { h: hs, v: [vs, vs] };

  function restore(): void {
    hs = geometry.y + geometry.height * 0.5;
    vs = geometry.x + geometry.width * 0.5;
    separators = { h: hs, v: [vs, vs] };
  }

  function adjustGeometry(newGeometry: Geometry): void {
    geometry = newGeometry;
    restore();
  }

  function tileClients(clients: Array<Client>): void {
    const includedClients = clients.slice(0, maxClients);
    const tiles = getTiles(geometry, separators, includedClients.length);

    includedClients.forEach((client: Client, index: number) => {
      const tile = tiles[index];
      client.geometry = geometryUtils.gapArea(tile);
    });
  }

  function resizeClient(client: Client, previousGeometry: Geometry): void {
    const newGeometry = client.geometry;
    previousGeometry = previousGeometry;

    if (previousGeometry.y >= separators.h) {
      // Right
      separators.h += newGeometry.y - previousGeometry.y;
      if (previousGeometry.x >= separators.v[1]) {
        // Bottom right
        separators.v[1] += newGeometry.x - previousGeometry.x;
      } else {
        // Top right
        separators.v[1] += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
      }
    } else {
      separators.h += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
      // Left
      if (previousGeometry.x >= separators.v[0]) {
        // Bottom left
        separators.v[0] += newGeometry.x - previousGeometry.x;
      } else {
        // Top left
        separators.v[0] += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
      }
    }

    const maxV = 0.9 * (geometry.x + geometry.width);
    const minV = geometry.x + geometry.width * 0.1;

    const maxH = 0.9 * (geometry.y + geometry.height);
    const minH = geometry.y + geometry.height * 0.1;

    separators.v[0] = Math.min(Math.max(minV, separators.v[0]), maxV);
    separators.v[1] = Math.min(Math.max(minV, separators.v[1]), maxV);

    separators.h = Math.min(Math.max(minH, separators.h), maxH);
  }

  return {
    restore,
    maxClients,
    tileClients,
    resizeClient,
    geometry,
    separators,
    adjustGeometry,
  };
}
