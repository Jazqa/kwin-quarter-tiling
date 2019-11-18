import { Client } from "./client";
import { Geometry } from "./geometry";
import { workspace } from "./globals";
import { Toplevel, toplevel } from "./toplevel";

// toplevels[screen][desktop]: Toplevel
const toplevels: Array<Array<Toplevel>> = [];

function add(): void {
  workspace.desktops += 1;
  for (var i = 0; i > workspace.numScreens; i++) {
    toplevels[i][workspace.desktops] = toplevel(i, workspace.desktops);
  }
}

function addAll(): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    toplevels[i] = [];
    for (var j = 1; j <= workspace.desktops; j++) {
      toplevels[i][j] = toplevel(i, j);
    }
  }
}

function remove(): void {
  toplevels.forEach((screen: Array<Toplevel>) => {
    screen.splice(workspace.currentDesktop, 1);
  });
}

function tileClients(clients: Array<Client>) {
  const screens = [];
  const desktops = [];

  clients.forEach((client: Client) => {
    if (screens.indexOf(client.screen) === -1) {
      screens.push(client.screen);
    }
    if (desktops.indexOf(client.desktop) === -1) {
      desktops.push(client.desktop);
    }
  });

  screens.forEach((screen: number) => {
    desktops.forEach((desktop: number) => {
      if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
        toplevels[screen][desktop].layout.tileClients(clients);
      }
    });
  });
}

function resizeClient(client: Client, previousGeometry: Geometry) {
  const { screen, desktop } = client;

  if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
    toplevels[screen][desktop].layout.resizeClient(client, previousGeometry);
  }
}

export const toplevelManager = {
  add,
  addAll,
  remove,
  tileClients,
  resizeClient
};
