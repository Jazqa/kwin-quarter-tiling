import { gaps } from "./gaps";
import { clientManager } from "./clientManager";
import { workspace } from "./globals";
import { Client } from "./client";
import { Direction, geometryUtils } from "./geometry";

const resizeStep = 20;

const registerShortcut: (name: string, description: string, key: string, cb: () => void) => void =
  // @ts-ignore, KWin global
  registerShortcut ||
  function(): void {
    // This is never called, exists only as a dumb workaround to include this file in rollup
    workspace.currentDesktop = workspace.currentDesktop;
  };

function registerShortcuts(): void {
  registerShortcut("Quarter: Float On/Off", "Quarter: Float On/Off", "Meta+F", () =>
    clientManager.toggle(workspace.activeClient)
  );

  registerShortcut("Quarter: + Gap Size", "Quarter: + Gap Size", "Meta+Shift+PgUp", () => {
    gaps.increase();
    for (var i = 0; i < workspace.numScreens; i++) {
      clientManager.tileAll(i, workspace.currentDesktop);
    }
  });

  registerShortcut("Quarter: - Gap Size", "Quarter: - Gap Size", "Meta+Shift+PgDown", () => {
    gaps.decrease();
    for (var i = 0; i < workspace.numScreens; i++) {
      clientManager.tileAll(i, workspace.currentDesktop);
    }
  });

  // Resize

  function resizeClient(direction: Direction, amount: number) {
    const client = workspace.activeClient;

    const newGeometry = client.geometry;
    const oldGeometry = client.geometry;

    const index = clientManager.find(client);
    if (index > -1) {
      switch (direction) {
        case "top":
          newGeometry.y += -amount;
          newGeometry.height += amount > 0 ? amount : 0;
          break;
        case "left":
          newGeometry.x += -amount;
          newGeometry.width += amount > 0 ? amount : 0;
          break;
        case "bottom":
          newGeometry.height += amount;
          break;
        case "right":
          newGeometry.width += amount;
          break;
      }

      clientManager.resize({ ...client, geometry: newGeometry }, oldGeometry);
      clientManager.tileAll(client.screen, client.desktop);
    }
  }

  registerShortcut("Quarter: + Window Size Top", "Quarter: + Window Size Top", "Meta+K", function() {
    resizeClient("top", resizeStep);
  });

  registerShortcut("Quarter: - Window Size Top", "Quarter: - Window Size Top", "Meta+Shift+K", function() {
    resizeClient("top", -resizeStep);
  });

  registerShortcut("Quarter: + Window Size Left", "Quarter: + Window Size Left", "Meta+H", function() {
    resizeClient("left", resizeStep);
  });

  registerShortcut("Quarter: - Window Size Left", "Quarter: - Window Size Left", "Meta+Shift+H", function() {
    resizeClient("left", -resizeStep);
  });

  registerShortcut("Quarter: + Window Size Right", "Quarter: + Window Size Right", "Meta+L", function() {
    resizeClient("right", resizeStep);
  });

  registerShortcut("Quarter: - Window Size Right", "Quarter: - Window Size Right", "Meta+Shift+L", function() {
    resizeClient("right", -resizeStep);
  });

  registerShortcut("Quarter: + Window Size Bottom", "Quarter: + Window Size Bottom", "Meta+J", function() {
    resizeClient("top", resizeStep);
  });

  registerShortcut("Quarter: - Window Size Bottom", "Quarter: - Window Size Bottom", "Meta+Shift+J", function() {
    resizeClient("top", -resizeStep);
  });

  // Move

  function nextClient(direction: Direction) {
    const activeClient = workspace.activeClient;

    var clients = clientManager.filter(activeClient.screen, activeClient.desktop);

    clients = clients.filter((client: Client) => {
      switch (direction) {
        case "top":
          return client.geometry.y < activeClient.geometry.y;
        case "left":
          return client.geometry.x < activeClient.geometry.x;
        case "bottom":
          return client.geometry.y > activeClient.geometry.y;
        case "right":
          return client.geometry.x > activeClient.geometry.x;
      }
    });

    clients.sort((clientA: Client, clientB: Client) => {
      return (
        geometryUtils.distance(activeClient.geometry, clientA.geometry) -
        geometryUtils.distance(activeClient.geometry, clientB.geometry)
      );
    });

    return clients[0];
  }

  function moveClient(direction: Direction) {
    const i = clientManager.find(workspace.activeClient);
    const j = clientManager.find(nextClient(direction));

    if (i > -1 && j > -1) {
      clientManager.swap(i, j);
      clientManager.tileAll(workspace.activeScreen, workspace.currentDesktop);
    }
  }

  registerShortcut("Quarter: Move Up", "Quarter: Move Up", "Alt+Shift+K", function() {
    moveClient("top");
  });

  registerShortcut("Quarter: Move Left", "Quarter: Move Left", "Alt+Shift+H", function() {
    moveClient("left");
  });

  registerShortcut("Quarter: Move Down", "Quarter: Move Down", "Alt+Shift+J", function() {
    moveClient("bottom");
  });

  registerShortcut("Quarter: Move Right", "Quarter: Move Right", "Alt+Shift+L", function() {
    moveClient("right");
  });

  function focusClient(direction: Direction) {
    const focusableClient = nextClient(direction);

    workspace.clientList().some((client: Client) => {
      if (focusableClient.windowId === client.windowId) {
        workspace.activeClient = client;
        return true;
      }
    });
  }

  registerShortcut("Quarter: Focus Up", "Quarter: Focus Up", "Alt+K", function() {
    focusClient("top");
  });

  registerShortcut("Quarter: Focus Left", "Quarter: Focus Left", "Alt+H", function() {
    focusClient("left");
  });

  registerShortcut("Quarter: Focus Down", "Quarter: Focus Down", "Alt+J", function() {
    focusClient("bottom");
  });

  registerShortcut("Quarter: Focus Right", "Quarter: Focus Right", "Alt+L", function() {
    focusClient("right");
  });
}

export const shortcuts = {
  registerShortcuts
};
