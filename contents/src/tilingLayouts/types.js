// @flow
import type { KWClient, KWGeometry } from "../kwTypes";

export interface TilingLayout {
  maxClients: number;
  tileClients: (clients: Array<KWClient>) => void;
  resizeClient: (client: KWClient, snapshot: KWGeometry) => void;
}
