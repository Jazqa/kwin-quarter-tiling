import { config } from "./config";
import { geometry } from "./geometry";
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
  const screenGeometry = geometry.freeArea(
    workspace.clientArea(1, screen, desktop),
    workspace.clientArea(0, screen, desktop)
  );

  const layout = new SelectedLayout(screenGeometry);

  const toplevel: Toplevel = {
    screen,
    desktop,
    layout
  };

  return toplevel;
}
