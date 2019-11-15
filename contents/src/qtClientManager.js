// @flow
import { kwReadConfigString, kwRegisterShortcut, kwWorkspace } from "./kwGlobals";
import { isEligible } from "./qtBlacklist";
import QTLayoutManager from "./qtLayoutManager";
import type { KWClient, KWGeometry } from "./kwTypes";

const calculateDistance = (geometryA: KWGeometry, geometryB: KWGeometry) => {
  return Math.abs(geometryA.x - geometryB.x) + Math.abs(geometryA.y - geometryB.y);
};

const swapClientGeometry = (clientA: KWClient, clientB: KWClient) => {
  if (clientA.windowId !== clientB.windowId) {
    const temporaryGeometry = { ...clientB.geometry };
    clientB.geometry = { ...clientA.geometry };
    clientA.geometry = temporaryGeometry;
  }
};

class QTClientManager {
  clients: Array<KWClient> = [];

  constructor() {
    kwRegisterShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", this.floatClient);

    if (kwReadConfigString("autoTile", true) === "true") {
      kwWorkspace.clientList().forEach(this.addClient);
      kwWorkspace.clientAdded.connect(this.addClient);
    }

    kwWorkspace.clientRemoved.connect(this.removeClient);
    kwWorkspace.clientMaximizeSet.connect(this.maximizeClient);
    kwWorkspace.clientFullScreenSet.connect(this.fullScreenClient);
    kwWorkspace.clientUnminimized.connect(this.addClient);
    kwWorkspace.clientMinimized.connect(this.removeClient);

    kwWorkspace.currentDesktopChanged.connect((desktop: number) => {
      QTLayoutManager.tileScreens(this.clients, desktop);
    });
    // kwWorkspace.desktopPresenceChanged.connect(changeDesktop);
  }

  // Add/Remove clients
  findClient = (client: KWClient): number => {
    var index = -1;

    this.clients.some((tiledClient: KWClient, tiledIndex: number) => {
      if (client.windowId === tiledClient.windowId) {
        index = tiledIndex;
        return true;
      }
    });

    return index;
  };

  addClient = (client: KWClient): void => {
    if (isEligible(client)) {
      this.clients.push(client);

      client.clientStartUserMovedResized.connect(this.startMoveClient);
      client.clientFinishUserMovedResized.connect(this.finishMoveClient);

      QTLayoutManager.tileLayout(this.clients, client.screen, client.desktop);
    }
  };

  removeClient = (client: KWClient): void => {
    const index = this.findClient(client);

    if (index > -1) {
      this.clients.splice(index, 1);

      client.clientStartUserMovedResized.disconnect(this.startMoveClient);
      client.clientFinishUserMovedResized.disconnect(this.finishMoveClient);

      QTLayoutManager.tileLayout(this.clients, client.screen, client.desktop);
    }
  };

  floatClient = (client: KWClient): void => {
    const index = this.findClient(client);

    if (index > -1) {
      this.removeClient(client);
    } else {
      this.addClient(client);
    }
  };

  // Move/Resize clients
  maximizeClient = (client: KWClient, h: boolean, v: boolean): void => {
    if (h && v) {
      this.removeClient(client);
    }
  };

  fullScreenClient = (client: KWClient, fullScreen: boolean): void => {
    if (fullScreen) {
      this.removeClient(client);
    }
  };

  snapshot: { geometry: KWGeometry, screen: number } = {};
  startMoveClient = (client: KWClient): void => {
    this.snapshot.geometry = client.geometry;
    this.snapshot.screen = client.screen;
  };

  finishMoveClient = (client: KWClient): void => {
    const index = this.findClient(client);

    if (index > -1) {
      if (client.screen === this.snapshot.screen) {
        if (
          client.geometry.width === this.snapshot.geometry.width &&
          client.geometry.height === this.snapshot.geometry.height
        ) {
          swapClientGeometry(client, this.findClosestClient(client));
        } else {
          QTLayoutManager.resizeClient(client, this.snapshot.geometry);
        }
      } else {
        QTLayoutManager.tileLayout(this.clients, client.screen, client.desktop);
        QTLayoutManager.tileLayout(this.clients, this.snapshot.screen, client.desktop);
      }
    }
  };

  findClosestClient = (clientA: KWClient): KWClient => {
    var closestClient = clientA;
    var closestDistance = calculateDistance(clientA.geometry, this.snapshot.geometry);

    this.clients.forEach((clientB: Object) => {
      if (
        clientA.windowId !== clientB.windowId &&
        clientA.screen === clientB.screen &&
        clientA.desktop &&
        clientB.desktop
      ) {
        const distance = calculateDistance(clientA.geometry, clientB.geometry);
        if (distance < closestDistance) {
          closestClient = clientB;
          closestDistance = distance;
        }
      }
    });

    return closestClient;
  };
}

export default new QTClientManager();
