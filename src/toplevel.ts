import { config } from "./config";
import { geometric } from "./geometric";
import { workspace } from "./globals";
import { Layout } from "./layout";
import { layouts } from "./layouts/layouts";

const SelectedLayout = layouts[config.layout];

export interface Toplevel {
  screen: number;
  desktop: number;
  layout: Layout;
}

export function toplevel(screen: number, desktop: number): Toplevel {
  const screenGeometry = geometric.freeArea(
    workspace.clientArea(1, screen, desktop),
    workspace.clientArea(0, screen, desktop)
  );

  const layout = new SelectedLayout(screenGeometry);

  return {
    screen,
    desktop,
    layout
  };
}
