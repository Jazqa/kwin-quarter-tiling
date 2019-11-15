// @flow
import type { TilingLayout } from "./types";
import type { KWClient, KWGeometry } from "../kwTypes";

type Separators = {
  h: Array<number>,
  v: number
};

export class QuarterVertical implements TilingLayout {
  maxClients: number = 4;
  availableGeometry: KWGeometry;
  separators: Separators;
  tiles: Array<KWGeometry> = [];

  constructor(availableGeometry: KWGeometry) {
    this.availableGeometry = availableGeometry;

    const hs = availableGeometry.x + availableGeometry.width * 0.5;
    const vs = availableGeometry.y + availableGeometry.height * 0.5;

    this.separators = { h: [hs, hs], v: vs };

    this.tiles = this.getTiles();
  }

  getTiles = (): Array<KWGeometry> => {
    const { x, y, width, height } = this.availableGeometry;

    return [
      {
        x,
        y,
        width: this.separators.v - x,
        height: this.separators.h[0] - y
      },
      {
        x: this.separators.v,
        y,
        width: x + width - this.separators.v,
        height: this.separators.h[1] - y
      },
      {
        x: this.separators.v,
        y: this.separators.h[1],
        width: x + width - this.separators.v,
        height: y + height - this.separators.h[1]
      },
      {
        x,
        y: this.separators.h[0],
        width: this.separators.v - x,
        height: y + height - this.separators.h[0]
      }
    ];
  };

  tileClients = (clients: Array<KWClient>): void => {
    this.tiles = this.getTiles();
    clients.slice(0, this.maxClients - 1).forEach((client, index) => {
      client.geometry = this.tiles[index];
    });
  };

  resizeClient = (client: KWClient, snapshot: KWGeometry): void => {};
}
