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
  const layout = new SelectedLayout(workspace.clientArea(0, screen, desktop));

  return {
    screen,
    desktop,
    layout
  };
}
