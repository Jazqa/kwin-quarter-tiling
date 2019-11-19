import { blacklist } from "./blacklist";
import { Client } from "./client";
import { config } from "./config";
import { Geometry } from "./geometry";
import { geometric } from "./geometric";
import { workspace } from "./globals";
import { toplevelManager } from "./toplevelManager";

const clients: Array<Client> = [];

function filter(screen: number, desktop: number): Array<Client> {
  const includedClients = clients.filter((client: Client) => {
    return client.screen === screen && client.desktop && desktop;
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

function add(client: Client) {
  const currentClients = filter(client.screen, client.desktop);
  const { screen, desktop } = client;

  if (!blacklist.includes(client)) {
    if (!toplevelManager.isFull(currentClients, screen, desktop)) {
      clients.push(client);

      client.clientStartUserMovedResized.connect(startMove);
      client.clientFinishUserMovedResized.connect(finishMove);

      tileAll(screen, desktop);
    } else {
    }
  }
}

function addAll() {
  if (config.autoTile) {
    workspace.clientList().forEach(add);
  }
}

function remove(client: Client) {
  const index = find(client);

  if (index > -1) {
    clients.splice(index, 1);

    client.clientStartUserMovedResized.disconnect(startMove);
    client.clientFinishUserMovedResized.disconnect(finishMove);

    tileAll(client.screen, client.desktop);
  }
}

function toggle(client: Client): void {
  const index = find(client);

  if (index > -1) {
    remove(client);
  } else {
    add(client);
  }
}

function maximize(client: Client, h: boolean, v: boolean): void {
  if (h && v) {
    remove(client);
  } else if (!h && !v) {
    add(client);
  }
}

function fullScreen(client: Client, fullScreen: boolean): void {
  if (fullScreen) {
    remove(client);
  }
}

var snapshot: { geometry: Geometry; screen: number } = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };

function findClosest(indexA: number, clientA: Client): number {
  var closestClientIndex = indexA;
  var closestDistance = geometric.distance(clientA.geometry, snapshot.geometry);

  clients.forEach((clientB: Client, indexB: number) => {
    if (
      clientA.windowId !== clientB.windowId &&
      clientA.screen === clientB.screen &&
      clientA.desktop &&
      clientB.desktop
    ) {
      const distance = geometric.distance(clientA.geometry, clientB.geometry);
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
  const { screen, desktop, geometry } = client;

  if (index > -1) {
    if (screen === snapshot.screen) {
      finishMoveSameScreen(index, client);
    } else {
      finishMoveOtherScreen(index, client);
    }
  }
}

function finishMoveSameScreen(index: number, client: Client) {
  if (client.geometry.width === snapshot.geometry.width && client.geometry.height === snapshot.geometry.height) {
    swap(index, findClosest(index, client));
  } else {
    resize(client, snapshot.geometry);
  }

  tileAll(client.screen, client.desktop);
}

function finishMoveOtherScreen(index: number, client: Client) {
  const { screen, desktop } = client;

  // isFull is not used, because the length has to be above maxClients (the client has already been moved to the new screen)
  if (filter(screen, desktop).length > toplevelManager.maxClients(screen, desktop)) {
    remove(client);
  } else {
    tileAll(screen, desktop);
  }

  tileAll(snapshot.screen, desktop);
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
  toplevelManager.tileClients(filter(screen, desktop));
}

export const clientManager = {
  add,
  addAll,
  remove,
  toggle,
  maximize,
  fullScreen,
  startMove,
  finishMove,
  resize,
  tileAll
};
