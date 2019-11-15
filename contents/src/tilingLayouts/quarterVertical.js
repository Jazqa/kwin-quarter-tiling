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

    const hs = this.availableGeometry.x + this.availableGeometry.width * 0.5;
    const vs = this.availableGeometry.y + this.availableGeometry.height * 0.5;

    this.separators = { h: [hs, hs], v: vs };
  }

  tileClients = (clients: Array<KWClient>) => {
    clients.slice(0, this.maxClients - 1).forEach((client, index) => {
      client.geometry = this.tiles[index];
    });
  };

  resizeClient = (client: KWClient, snapshot: KWGeometry) => {};
}
