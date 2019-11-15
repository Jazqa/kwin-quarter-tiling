// @flow
import { kwWorkspace } from "./kwGlobals";
import { QTLayout } from "./qtLayout";
import type { KWClient, KWGeometry } from "./kwTypes";

class QTLayoutManager {
  layouts: Array<Array<QTLayout>> = [];

  constructor() {
    for (var i = 0; i < kwWorkspace.numScreens; i++) {
      this.layouts[i] = [];
      for (var j = 1; j <= kwWorkspace.desktops; j++) {
        this.layouts[i][j] = new QTLayout(i, j);
      }
    }

    kwWorkspace.currentDesktopChanged.connect(this.tileScreens);
    // kwWorkspace.desktopPresenceChanged.connect(changeDesktop);
  }

  resizeClient = (client: KWClient, snapshot: KWGeometry): void => {
    this.layouts[client.screen][client.desktop].resizeClient(client, snapshot);
  };

  tileLayout = (screen: number, desktop: number): void => {
    this.layouts[screen][desktop].tileClients();
  };

  tileScreens = (desktop: number): void => {
    this.layouts.forEach(screen => {
      screen.forEach(desktop => {
        desktop.tileClients();
      });
    });
  };

  createDesktop = (): void => {
    kwWorkspace.desktops += 1;
    for (var i = 0; i > kwWorkspace.numScreens; i++) {
      this.layouts[i][kwWorkspace.desktops] = new QTLayout(i, kwWorkspace.desktops);
    }
  };

  removeDesktop = (): void => {
    this.layouts.forEach(screen => {
      screen.splice(kwWorkspace.currentDesktop, 1);
    });
  };
}

export default new QTLayoutManager();
