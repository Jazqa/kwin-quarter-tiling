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
    clientB.geometry = clientA.geometry;
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
  }

  // Add/Remove clients
  findClient = (client: KWClient) => {
    return this.clients.findIndex((tiledClient: KWClient) => {
      return client.windowId === tiledClient.windowId;
    });
  };

  addClient = (client: KWClient) => {
    if (isEligible(client)) {
      this.clients.push(client);

      client.clientStartUserMovedResized.connect(this.startMoveClient);
      client.clientFinishUserMovedResized.connect(this.finishMoveClient);

      QTLayoutManager.tileLayout(client.screen, client.desktop);
    }
  };

  removeClient = (client: KWClient) => {
    const index = this.findClient(client);

    if (index > -1) {
      this.clients.splice(index, 1);

      client.clientStartUserMovedResized.disconnect(this.startMoveClient);
      client.clientFinishUserMovedResized.disconnect(this.finishMoveClient);

      QTLayoutManager.tileLayout(client.screen, client.desktop);
    }
  };

  floatClient = (client: KWClient) => {
    const index = this.findClient(client);

    if (index > -1) {
      this.removeClient(client);
    } else {
      this.addClient(client);
    }
  };

  // Move/Resize clients
  maximizeClient = (client: KWClient, h: boolean, v: boolean) => {
    if (h && v) {
      this.removeClient(client);
    }
  };

  fullScreenClient = (client: KWClient, fullScreen: boolean) => {
    if (fullScreen) {
      this.removeClient(client);
    }
  };

  snapshot: { geometry: KWGeometry, screen: number };

  startMoveClient = (client: KWClient) => {
    this.snapshot.geometry = client.geometry;
    this.snapshot.screen = client.screen;
  };

  finishMoveClient = (client: KWClient) => {
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
        QTLayoutManager.tileLayout(client.screen, client.desktop);
        QTLayoutManager.tileLayout(this.snapshot.screen, client.desktop);
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
