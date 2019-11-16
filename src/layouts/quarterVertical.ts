import { Client } from "../client";
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

  const hs = x + width * 0.5;
  const vs = y + height * 0.5;
  const separators = { h: [hs, hs], v: vs };

  function tileClients(clients: Array<Client>): void {
    const tiles = getTiles(geometry, separators);
    clients.slice(0, maxClients - 1).forEach((client: Client, index: number) => {
      client.geometry = tiles[index];
    });
  }

  function resizeClient(client: Client, previousGeometry: Geometry): void {}

  const layout: QuarterVerticalLayout = {
    maxClients,
    tileClients,
    resizeClient,

    geometry,
    separators
  };

  return layout;
}
