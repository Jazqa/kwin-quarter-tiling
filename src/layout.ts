import { Client } from "./client";
import { Geometry } from "./geometry";

/*
 * An interface which all tiling layouts should implement
 */

export interface Layout {
  /*
   * Maximum amount of clients the Layout can tile
   */
  maxClients: number;

  /*
   *  Tiles all clientsOnLayout according to Layout's tiling rules
   *
   *  @param clientsOnLayout - Array of clients on the layout (clientManager.clients filtered by the screen and desktop of the layout)
   */
  tileClients: (clientsOnLayout: Array<Client>) => void;

  /*
   *  Resizes a clientOnLayout and adjusts the Layout's tiling accordingly
   *
   *  @param clientOnLayout - A client that ecists on the layout (client.desktop and client.screen match those of the layout)
   *  @param previousGeometry - Geometry of the client when clientStartUserMovedResized was triggered (clientManager.snapshot.geometry)
   */
  resizeClient: (clientOnLayout: Client, previousGeometry: Geometry) => void;
}
