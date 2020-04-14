import { Client } from "../client";
import { Geometry, geometryUtils } from "../geometry";
import { Layout } from "../layout";

interface Separators {
  h: Array<number>;
  v: number;
}

interface QuarterHorizontalLayout extends Layout {
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
      height: h[0] - y,
    },
    {
      x: v,
      y,
      width: x + width - v,
      height: h[1] - y,
    },
    {
      x: v,
      y: h[1],
      width: x + width - v,
      height: y + height - h[1],
    },
    {
      x,
      y: h[0],
      width: v - x,
      height: y + height - h[0],
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

export function QuarterHorizontal(geometry: Geometry): QuarterHorizontalLayout {
  const maxClients = 4;

  let hs = geometry.y + geometry.height * 0.5;
  let vs = geometry.x + geometry.width * 0.5;
  let separators = { h: [hs, hs], v: vs };

  function restore(): void {
    hs = geometry.y + geometry.height * 0.5;
    vs = geometry.x + geometry.width * 0.5;
    separators = { h: [hs, hs], v: vs };
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
      // Right
      separators.v += newGeometry.x - previousGeometry.x;
      if (previousGeometry.y >= separators.h[1]) {
        // Bottom right
        separators.h[1] += newGeometry.y - previousGeometry.y;
      } else {
        // Top right
        separators.h[1] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
      }
    } else {
      separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
      // Left
      if (previousGeometry.y >= separators.h[0]) {
        // Bottom left
        separators.h[0] += newGeometry.y - previousGeometry.y;
      } else {
        // Top left
        separators.h[0] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
      }
    }

    const maxV = 0.9 * (geometry.x + geometry.width);
    const minV = geometry.x + geometry.width * 0.1;

    const maxH = 0.9 * (geometry.y + geometry.height);
    const minH = geometry.y + geometry.height * 0.1;

    separators.v = Math.min(Math.max(minV, separators.v), maxV);

    separators.h[0] = Math.min(Math.max(minH, separators.h[0]), maxH);
    separators.h[1] = Math.min(Math.max(minH, separators.h[1]), maxH);
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
