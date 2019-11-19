import { config } from "./config";
import { workspace } from "./globals";
import { Layout } from "./layout";
import { layouts } from "./layouts/layouts";
import { gaps } from "./gaps";
import { Geometry } from "./geometry";
import { geometric } from "./geometric";

import { Client } from "./client";

const SelectedLayout = layouts[config.layout];

export interface Toplevel {
  screen: number;
  desktop: number;
  layout: Layout;
  tileClients: (clients: Array<Client>) => void;
}

function adjustGeometry(geometry: Geometry): Geometry {
  var { x, y, width, height } = geometry;

  y += gaps.size + config.margins.top;
  x += gaps.size + config.margins.left;

  height -= gaps.size * 2 + config.margins.top + config.margins.bottom;
  width -= gaps.size * 2 + config.margins.left + config.margins.right;

  return { x, y, width, height };
}

export function toplevel(screen: number, desktop: number): Toplevel {
  var geometry = workspace.clientArea(0, screen, desktop);
  var layout = new SelectedLayout(adjustGeometry(geometry));

  function tileClients(clients: Array<Client>): void {
    const currentGeometry = workspace.clientArea(0, screen, desktop);

    if (geometry.width !== currentGeometry.width || geometry.height !== currentGeometry.height) {
      layout.adjustGeometry(adjustGeometry(currentGeometry));
      geometry = currentGeometry;
    }

    layout.tileClients(clients);
  }

  return {
    screen,
    desktop,
    layout,
    tileClients
  };
}
