import { clientManager } from "./clientManager";
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
  // workspace.currentDesktopChanged.connect(currentDesktopChanged);
  // workspace.desktopPresenceChanged.connect(desktopPresenceChanged);
}

export const signals = {
  registerSignals
};
