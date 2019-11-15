// @flow
import { kwWorkspace, kwPrint } from "./kwGlobals";
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

  tileLayout = (clients: Array<KWClient>, screen: number, desktop: number): void => {
    this.layouts[screen][desktop].tileClients(clients);
  };

  tileScreens = (clients: Array<KWClient>, desktop: number): void => {
    const clientsOnDesktop = clients.filter((client: KWClient) => {
      return client.desktop === desktop;
    });

    this.layouts.forEach((screen: Array<QTLayout>) => {
      const clientsOnScreen = clientsOnDesktop.filter((client: KWClient) => {
        return client.screen === screen;
      });

      screen.forEach((desktop: QTLayout) => {
        desktop.tileClients(clients);
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
