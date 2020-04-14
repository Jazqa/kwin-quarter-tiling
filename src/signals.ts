import { clientManager } from "./clientManager";
import { Client } from "./client";
import { config } from "./config";
import { workspace, print } from "./globals";
import { toplevelManager } from "./toplevelManager";

export function registerSignals(): void {
  if (config.autoTile) {
    workspace.clientAdded.connect((client: Client) => {
      if (client) {
        clientManager.addWithForce(client);
      }
    });
  }

  workspace.clientUnminimized.connect((client: Client) => {
    if (client && config.autoTile) {
      clientManager.addWithForce(client);
    }
  });

  workspace.clientRemoved.connect((client: Client) => {
    if (client) {
      clientManager.remove(client);
    }
  });

  workspace.clientMinimized.connect((client: Client) => {
    if (client) {
      clientManager.disable(client);
    }
  });

  workspace.clientMaximizeSet.connect((client: Client, h: boolean, v: boolean) => {
    if (client && h && v) {
      clientManager.disable(client, undefined, true);
      workspace.activeClient = client;
    } else if (client && !h && !v) {
      if (config.autoTile) {
        clientManager.addWithForce(client);
      }
    }
  });

  workspace.clientFullScreenSet.connect((client: Client, fs: boolean) => {
    if (client && fs) {
      clientManager.disable(client, undefined, true);
    } else {
      if (config.autoTile) {
        clientManager.addWithForce(client);
      }
    }
  });

  workspace.desktopPresenceChanged.connect((client: Client, desktop: number) => {
    if (client) {
      clientManager.tileAll(client.screen, desktop);
    }
  });

  workspace.clientActivated.connect((client: Client) => {
    if (client) {
      clientManager.tileAll(client.screen, client.desktop);
    }
  });

  workspace.numberDesktopsChanged.connect((previousDesktops: number) => {
    if (workspace.desktops > previousDesktops) {
      toplevelManager.addDesktop(workspace.desktops);
    } else {
      toplevelManager.removeDesktop(previousDesktops);
    }

    toplevelManager.forEachScreen(workspace.currentDesktop, (screen: number, desktop: number) => {
      clientManager.tileAll(screen, desktop);
    });
  });

  workspace.numberScreensChanged.connect((count: number) => {
    toplevelManager.addAll();
  });

  workspace.screenResized.connect((screen: number) => {
    clientManager.tileAll(screen, workspace.currentDesktop);
  });
}

export const signals = {
  registerSignals,
};
