import { Client } from "./client";
import { Geometry } from "./geometry";
import { workspace } from "./globals";
import { Toplevel, toplevel } from "./toplevel";
import { config } from "./config";

// toplevels[screen][desktop]: Toplevel
const toplevels: Array<Array<Toplevel | null>> = [];

function addAll(): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    toplevels[i] = [];
    for (var j = 1; j <= workspace.desktops; j++) {
      toplevels[i][j] = toplevel(i, j);
    }
  }
}

function addDesktop(desktop: number): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    if (toplevels && toplevels[i] && !toplevels[i][desktop]) {
      toplevels[i][desktop] = toplevel(i, desktop);
    }
  }
}

function removeDesktop(desktop: number): void {
  forEachScreen(desktop, (screen: number, desktop: number): void => {
    delete toplevels[screen][desktop];
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
        toplevels[screen][desktop].tileClients(
          clients.filter((client: Client) => {
            return client.screen === screen && client.desktop === desktop;
          })
        );
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

function maxClients(screen: number, desktop: number): number {
  if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
    return config.maxClients > -1 ? config.maxClients : toplevels[screen][desktop].layout.maxClients;
  } else {
    return 0;
  }
}

function isFull(clients: Array<Client>, screen: number, desktop: number): boolean {
  return clients.length >= maxClients(screen, desktop);
}

function isEmpty(clients: Array<Client>, screen: number, desktop: number): boolean {
  if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
    return clients.length === 0;
  } else {
    return false;
  }
}

function forEach(callback: (screen: number, desktop: number) => boolean | void): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    for (var j = 1; j <= workspace.desktops; j++) {
      if (toplevels && toplevels[i] && toplevels[i][j]) {
        const shouldReturn = callback(i, j);
        if (shouldReturn) {
          return;
        }
      }
    }
  }
}

function forEachScreen(desktop: number, callback: (screen: number, desktop: number) => boolean | void): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    if (toplevels && toplevels[i] && toplevels[i][desktop]) {
      const shouldReturn = callback(i, desktop);
      if (shouldReturn) {
        return;
      }
    }
  }
}

function forEachDesktop(screen: number, callback: (screen: number, desktop: number) => boolean | void): void {
  for (var i = 1; i <= workspace.desktops; i++) {
    if (toplevels && toplevels[screen] && toplevels[screen][i]) {
      const shouldReturn = callback(screen, i);
      if (shouldReturn) {
        return;
      }
    }
  }
}

function restoreLayout(screen: number, desktop: number) {
  if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
    toplevels[screen][desktop].layout.restore();
  }
}

function adjustMaxClients(screen: number, desktop: number, amount: number) {
  if (toplevels && toplevels[screen] && toplevels[screen][desktop]) {
    toplevels[screen][desktop].layout.maxClients += amount;
  }
}

export const toplevelManager = {
  addAll,
  addDesktop,
  removeDesktop,
  tileClients,
  resizeClient,
  maxClients,
  isFull,
  isEmpty,
  forEach,
  forEachScreen,
  forEachDesktop,
  restoreLayout,
  adjustMaxClients,
};
