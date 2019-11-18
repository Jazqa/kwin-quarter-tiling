import { Client } from "../client";
import { geometric } from "../geometric";
import { Geometry } from "../geometry";
import { Layout } from "../layout";

interface Separators {
  h: Array<number>;
  v: number;
}

interface QuarterVerticalLayout extends Layout {
  geometry: Geometry;

  separators: Separators;
}

function getTiles(geometry: Geometry, separators: Separators): Array<Geometry> {
  const { x, y, width, height } = geometry;
  const { v, h } = separators;

  return [
    {
      x,
      y,
      width: v - x,
      height: h[0] - y
    },
    {
      x: v,
      y,
      width: x + width - v,
      height: h[1] - y
    },
    {
      x: v,
      y: h[1],
      width: x + width - v,
      height: y + height - h[1]
    },
    {
      x,
      y: h[0],
      width: v - x,
      height: y + height - h[0]
    }
  ];
}

export function QuarterVertical(geometry: Geometry): QuarterVerticalLayout {
  const { x, y, width, height } = geometry;

  const maxClients = 4;

  const hs = y + height * 0.5;
  const vs = x + width * 0.5;
  const separators = { h: [hs, hs], v: vs };

  function tileClients(clients: Array<Client>): void {
    const tiles = getTiles(geometry, separators);
    const includedClients = clients.slice(0, maxClients);

    includedClients.forEach((client: Client, index: number) => {
      const tile = tiles[index];
      client.geometry = geometric.gapArea(tile);
    });
  }

  function resizeClient(client: Client, previousGeometry: Geometry): void {
    const newGeometry = geometric.fullArea(client.geometry);
    previousGeometry = geometric.fullArea(previousGeometry);

    if (previousGeometry.x >= separators.v) {
      // Right
      separators.v += newGeometry.y - previousGeometry.y;
      if (previousGeometry.y >= separators.h[1]) {
        // Bottom right
        separators.h[1] += newGeometry.x - previousGeometry.x;
      } else {
        // Top right
        separators.h[1] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
      }
    } else {
      separators.v += newGeometry.x === previousGeometry.x ? newGeometry.width - previousGeometry.width : 0;
      // Left
      if (previousGeometry.y >= separators.h[0]) {
        // Bottom left
        separators.h[0] += newGeometry.x - previousGeometry.x;
      } else {
        // Top left
        separators.h[0] += newGeometry.y === previousGeometry.y ? newGeometry.height - previousGeometry.height : 0;
      }
    }
  }

  return {
    maxClients,
    tileClients,
    resizeClient,
    geometry,
    separators
  };
}
