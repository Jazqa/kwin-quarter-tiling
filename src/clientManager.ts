import { blacklist } from "./blacklist";
import { Client } from "./client";
import { config } from "./config";
import { Geometry, geometry } from "./geometry";
import { workspace } from "./globals";

const clients: Array<Client> = [];

function find(client: Client): number {
  var index = -1;

  this.clients.some((includedClient: Client, includedIndex: number) => {
    if (client.windowId === includedClient.windowId) {
      index = includedIndex;
      return true;
    }
  });

  return index;
}

function add(client: Client) {
  if (!blacklist.includes(client)) {
    clients.push(client);

    client.clientStartUserMovedResized.connect(this.startMoveClient);
    client.clientFinishUserMovedResized.connect(this.finishMoveClient);

    // TODO: tile(clients, client.screen, client.desktop);
  }
}

function addAll() {
  if (config.autoTile) {
    workspace.clientList().forEach(add);
  }
}

function remove(client: Client) {
  const index = this.findClient(client);

  if (index > -1) {
    this.clients.splice(index, 1);

    client.clientStartUserMovedResized.disconnect(this.startMoveClient);
    client.clientFinishUserMovedResized.disconnect(this.finishMoveClient);

    // TODO: tile(clients, client.screen, client.desktop);
  }
}

function toggle(client: Client): void {
  const index = this.findClient(client);

  if (index > -1) {
    this.removeClient(client);
  } else {
    this.addClient(client);
  }
}

function maximize(client: Client, h: boolean, v: boolean): void {
  if (h && v) {
    this.removeClient(client);
  }
}

function fullScreen(client: Client, fullScreen: boolean): void {
  if (fullScreen) {
    this.removeClient(client);
  }
}

const snapshot: { geometry: Geometry; screen: number } = { geometry: { x: 0, y: 0, width: 0, height: 0 }, screen: -1 };

function findClosest(indexA: number, clientA: Client): number {
  var closestClientIndex = indexA;
  var closestDistance = geometry.distance(clientA.geometry, this.snapshot.geometry);

  clients.forEach((clientB: Client, indexB: number) => {
    if (
      clientA.windowId !== clientB.windowId &&
      clientA.screen === clientB.screen &&
      clientA.desktop &&
      clientB.desktop
    ) {
      const distance = geometry.distance(clientA.geometry, clientB.geometry);
      if (distance < closestDistance) {
        closestClientIndex = indexB;
        closestDistance = distance;
      }
    }
  });

  return closestClientIndex;
}

function swap(i: number, j: number) {
  const t: Client = clients[i];
  clients[i] = clients[j];
  clients[j] = t;
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
        swap(index, findClosest(index, client));
      } else {
        // TODO: resize(client, snapshot.geometry);
      }
    } else {
      // TODO: tile(clients, client.screen, client.desktop);
      // TODO: tile(clients, snapshot.screen, client.desktop);
    }
  }
}

export const clientManager = {
  add,
  addAll,
  remove,
  toggle,
  maximize,
  fullScreen,
  startMove,
  finishMove
};
