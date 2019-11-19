import { clientManager } from "./clientManager";
import { Client } from "./client";
import { config } from "./config";
import { workspace } from "./globals";

export function registerSignals(): void {
  if (config.autoTile) {
    workspace.clientAdded.connect(clientManager.add);
  }

  workspace.clientRemoved.connect(clientManager.remove);
  workspace.clientMaximizeSet.connect(clientManager.maximize);
  workspace.clientFullScreenSet.connect(clientManager.fullScreen);
  workspace.clientUnminimized.connect(clientManager.add);
  workspace.clientMinimized.connect(clientManager.remove);

  workspace.currentDesktopChanged.connect((desktop: number, client: Client) => {
    for (var i = 0; i < workspace.numScreens; i++) {
      clientManager.tileAll(i, desktop);
    }
  });

  workspace.desktopPresenceChanged.connect((client: Client, desktop: number) => {
    clientManager.tileAll(client.screen, desktop);
  });
}

export const signals = {
  registerSignals
};
