import { blacklist } from "./blacklist";
import { Client } from "./client";
import { config } from "./config";
import { Geometry, geometryUtils } from "./geometry";
import { workspace } from "./globals";
import { toplevelManager } from "./toplevelManager";

const clients: Array<Client> = [];

function filter(screen: number, desktop: number): Array<Client> {
  const includedClients = clients.filter((client: Client) => {
    // TODO: Better activity support?
    return (
      client.screen === screen &&
      client.desktop === desktop &&
      (client.activities.length === 0 || client.activities.indexOf(workspace.currentActivity) > -1)
    );
  });

  return includedClients;
}

function find(client: Client): number {
  var index = -1;

  clients.some((includedClient: Client, includedIndex: number) => {
    if (client.windowId === includedClient.windowId) {
      index = includedIndex;
      return true;
    }
  });

  return index;
}

function splicePush(client: Client): void {
  var index = find(client);

  if (index > -1) {
    clients.splice(index, 1);
    clients.push(client);
  }
}

// Store the disconnectors in cases new functions have to be created (e.g. using accessing client without a param)
const clientDisconnectors = {};

function add(client: Client) {
  const { screen, desktop } = client;

  if (!blacklist.includes(client)) {
    clients.push(client);

    const splicePushClient = () => splicePush(client);

    client.clientStartUserMovedResized.connect(startMove);
    client.clientFinishUserMovedResized.connect(finishMove);
    client.screenChanged.connect(splicePushClient);
    client.desktopChanged.connect(splicePushClient);

    clientDisconnectors[client.windowId] = (client: Client) => {
      client.clientStartUserMovedResized.disconnect(startMove);
      client.clientFinishUserMovedResized.disconnect(finishMove);
      client.screenChanged.disconnect(splicePushClient);
      client.desktopChanged.disconnect(splicePushClient);
    };

    tileAll(screen, desktop);
  }
}

function addWithForce(client: Client) {
  if (!blacklist.includes(client)) {
    add(client);

    if (find(client) === -1) {
      var freeScreen = -1;

      toplevelManager.forEachScreen(client.desktop, (screen: number, desktop: number) => {
        if (!toplevelManager.isFull(filter(screen, desktop), screen, desktop)) {
          freeScreen = screen;
          return true;
        }
      });

      if (freeScreen > -1) {
        client.geometry = geometryUtils.moveTo(client.geometry, workspace.clientArea(1, freeScreen, client.desktop));
        add(client);
      } else {
        var freeDesktop = -1;

        toplevelManager.forEach((screen: number, desktop: number) => {
          if (!toplevelManager.isFull(filter(screen, desktop), screen, desktop)) {
            freeScreen = screen;
            freeDesktop = desktop;
            if (config.followClients) {
              workspace.currentDesktop = desktop;
            }
            return true;
          }
        });

        if (freeScreen > -1 && freeDesktop > -1) {
          client.desktop = freeDesktop;
          client.geometry = geometryUtils.moveTo(client.geometry, workspace.clientArea(1, freeScreen, client.desktop));
          add(client);
        } else {
          workspace.desktops += 1;
          addWithForce(client);
        }
      }
    }
  }
}

function addAll() {
  if (config.autoTile) {
    workspace.clientList().forEach(add);
  }
}

function remove(client: Client, index?: number) {
  index = index || find(client);

  if (index > -1) {
    clients.splice(index, 1);
    clientDisconnectors[client.windowId](client);
    delete clientDisconnectors[client.windowId];
    tileAll(client.screen, client.desktop);
  }
}

function toggle(client: Client, index?: number): void {
  index = index || find(client);

  if (index > -1) {
    remove(client, index);
  } else {
    add(client);
  }
}

var snapshot: { geometry: Geometry; screen: number } = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };

function findClosest(clientA: Client, indexA?: number): number {
  var closestClientIndex = indexA || find(clientA);
  var closestDistance = geometryUtils.distance(clientA.geometry, snapshot.geometry);

  clients.forEach((clientB: Client, indexB: number) => {
    if (
      clientA.windowId !== clientB.windowId &&
      clientA.screen === clientB.screen &&
      clientA.desktop === clientB.desktop
    ) {
      const distance = geometryUtils.distance(clientA.geometry, clientB.geometry);
      if (distance < closestDistance) {
        closestClientIndex = indexB;
        closestDistance = distance;
      }
    }
  });

  return closestClientIndex;
}

function startMove(client: Client): void {
  snapshot.geometry = client.geometry;
  snapshot.screen = client.screen;
}

function finishMove(client: Client): void {
  const index = find(client);

  if (index > -1) {
    if (client.screen === snapshot.screen) {
      if (client.geometry.width === snapshot.geometry.width && client.geometry.height === snapshot.geometry.height) {
        swap(index, findClosest(client, index));
      } else {
        resize(client, snapshot.geometry);
      }
    } else {
      tileAll(snapshot.screen, client.desktop);
    }

    tileAll(client.screen, client.desktop);
  }
}

function swap(i: number, j: number) {
  const t: Client = clients[i];
  clients[i] = clients[j];
  clients[j] = t;
}

function resize(client: Client, previousGeometry: Geometry) {
  toplevelManager.resizeClient(client, previousGeometry);
}

function tileAll(screen: number, desktop: number) {
  const includedClients = filter(screen, desktop);

  // Removes extra clients that exist on the toplevel
  while (includedClients.length > toplevelManager.maxClients(screen, desktop)) {
    const removableClient = includedClients.splice(includedClients.length - 1, 1)[0];
    remove(removableClient);
  }

  toplevelManager.tileClients(includedClients);
}

export const clientManager = {
  add,
  addWithForce,
  addAll,
  find,
  filter,
  remove,
  toggle,
  startMove,
  finishMove,
  swap,
  resize,
  tileAll
};
