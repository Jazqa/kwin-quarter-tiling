import { Client } from "../client";
import { Geometry, geometryUtils } from "../geometry";
import { Layout } from "../layout";

interface Separators {
  h: number;
  v: number;
}

interface QuarterSingleHorizontalLayout extends Layout {
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
      width: v - x,
      height: h - y,
    },
    {
      x: v,
      y,
      width: x + width - v,
      height: h - y,
    },
    {
      x: v,
      y: h,
      width: x + width - v,
      height: y + height - h,
    },
    {
      x,
      y: h,
      width: v - x,
      height: y + height - h,
    },
  ];

  if (count < 4) {
    tiles[0].height = tiles[3].y + tiles[3].height - tiles[0].y;
  }

  if (count < 3) {
    tiles[1].height = tiles[2].y + tiles[2].height - tiles[1].y;
  }

  if (count < 2) {
    tiles[0].width = tiles[1].x + tiles[1].width - tiles[0].x;
  }

  return tiles;
}

export function QuarterSingleHorizontal(geometry: Geometry): QuarterSingleHorizontalLayout {
  const maxClients = 4;

  let hs = geometry.y + geometry.height * 0.5;
  let vs = geometry.x + geometry.width * 0.5;
  let separators = { h: hs, v: vs };

  function restore(): void {
    hs = geometry.y + geometry.height * 0.5;
    vs = geometry.x + geometry.width * 0.5;
    separators = { h: hs, v: vs };
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

    if (previousGeometry.x >= separators.v) {
      separators.v += newGeometry.x - previousGeometry.x;
    } else {
      separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
    }

    if (previousGeometry.y >= separators.h) {
      separators.h += newGeometry.y - previousGeometry.y;
    } else {
      separators.h += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
    }

    const maxV = 0.9 * (geometry.x + geometry.width);
    const minV = geometry.x + geometry.width * 0.1;

    const maxH = 0.9 * (geometry.y + geometry.height);
    const minH = geometry.y + geometry.height * 0.1;

    separators.v = Math.min(Math.max(minV, separators.v), maxV);
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
