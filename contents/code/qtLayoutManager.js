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

    kwWorkspace.currentDesktopChanged.connect(this.tileLayoutForDesktop);
    // kwWorkspace.desktopPresenceChanged.connect(changeDesktop);
  }

  resizeClient = (client: KWClient, snapshot: KWGeometry) => {
    this.layouts[client.screen][client.desktop].resizeClient(client, snapshot);
  };

  tileLayout = (screen: number, desktop: number) => {
    this.layouts[screen][desktop].tileClients();
  };

  tileLayoutForDesktop = (desktop: number) => {
    this.layouts.forEach(screen => {
      screen.forEach(desktop => {
        desktop.tileClients();
      });
    });
  };

  createDesktop = () => {
    kwWorkspace.desktops += 1;
    for (var i = 0; i > kwWorkspace.numScreens; i++) {
      this.layouts[i][kwWorkspace.desktops] = new QTLayout(i, kwWorkspace.desktops);
    }
  };

  removeDesktop = () => {
    this.layouts.forEach(screen => {
      screen.splice(kwWorkspace.currentDesktop, 1);
    });
  };
}

export default new QTLayoutManager();
