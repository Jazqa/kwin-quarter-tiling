import { config } from "./config";
import { workspace } from "./globals";
import { Layout } from "./layout";
import { layouts } from "./layouts/layouts";
import { gaps } from "./gaps";
import { Geometry } from "./geometry";

import { Client } from "./client";

const SelectedLayout = layouts[config.layout];

export interface Toplevel {
  screen: number;
  desktop: number;
  layout: Layout;
  tileClients: (clients: Array<Client>) => void;
}

function availableArea(geometry: Geometry): Geometry {
  var { x, y, width, height } = geometry;

  y += gaps.size + config.margins.top;
  x += gaps.size + config.margins.left;

  height -= gaps.size * 2 + config.margins.top + config.margins.bottom;
  width -= gaps.size * 2 + config.margins.left + config.margins.right;

  return { x, y, width, height };
}

export function toplevel(screen: number, desktop: number): Toplevel | null {
  if (config.isIgnoredScreen(screen) || config.isIgnoredDesktop(desktop)) {
    return null;
  }

  // Geometry
  var geometry = availableArea(workspace.clientArea(2, screen, desktop));

  function hasGeometryChanged(newGeometry: Geometry) {
    return (
      geometry.x !== newGeometry.x ||
      geometry.y !== newGeometry.y ||
      geometry.width !== newGeometry.width ||
      geometry.height !== newGeometry.height
    );
  }

  function onGeometryChanged(newGeometry: Geometry) {
    geometry = newGeometry;
    layout.adjustGeometry(newGeometry);
  }

  // Layout
  var layout = SelectedLayout(geometry);

  if (config.maxClients > -1) {
    layout.maxClients = Math.min(layout.maxClients, config.maxClients);
  }

  function tileClients(clients: Array<Client>): void {
    const currentGeometry = availableArea(workspace.clientArea(2, screen, desktop));

    if (hasGeometryChanged(currentGeometry)) {
      onGeometryChanged(currentGeometry);
    }

    layout.tileClients(clients);
  }

  return {
    screen,
    desktop,
    layout,
    tileClients,
  };
}
