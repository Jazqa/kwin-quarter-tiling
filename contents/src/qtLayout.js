// @flow
import { kwReadConfigString, kwWorkspace } from "./kwGlobals";
import QTClientManager from "./qtClientManager";
import tilingLayouts from "./tilingLayouts";
import type { TilingLayout } from "./tilingLayouts/types";
import type { KWClient, KWGeometry } from "./kwTypes";

const SelectedTilingLayout = tilingLayouts[kwReadConfigString("layout", 0)];

export class QTLayout {
  screenId: number;
  desktopId: number;
  tilingLayout: TilingLayout;

  constructor(screenId: number, desktopId: number) {
    this.screenId = screenId;
    this.desktopId = desktopId;
    this.tilingLayout = new SelectedTilingLayout(this.getGeometry());
  }

  getGeometry = (): KWGeometry => {
    const fullGeometry = kwWorkspace.clientArea(1, this.screenId, kwWorkspace.desktopId);
    const availableGeometry = kwWorkspace.clientArea(0, this.screenId, kwWorkspace.desktopId);

    availableGeometry.width += fullGeometry.x < availableGeometry.x ? availableGeometry.x - fullGeometry.x : 0;
    availableGeometry.height += fullGeometry.y < availableGeometry.y ? availableGeometry.y - fullGeometry.y : 0;

    availableGeometry.width -=
      availableGeometry.x >= availableGeometry.width
        ? availableGeometry.x - availableGeometry.width
        : availableGeometry.x;

    availableGeometry.height -=
      availableGeometry.y >= availableGeometry.height
        ? availableGeometry.y - availableGeometry.height
        : availableGeometry.y;

    return availableGeometry;
  };

  getClients = (): Array<KWClient> => {
    return QTClientManager.clients.filter((client: KWClient) => {
      return client.screen === this.screenId && client.desktop === this.desktopId;
    });
  };

  maxClients = this.tilingLayout.maxClients;

  tileClients = () => {
    this.tilingLayout.tileClients(this.getClients());
  };

  resizeClient = this.tilingLayout.resizeClient;
}
