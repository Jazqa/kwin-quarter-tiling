import { config } from "./config";
import { workspace } from "./globals";
import { Layout } from "./layout";
import { layouts } from "./layouts/layouts";
import { gaps } from "./gaps";
import { Geometry } from "./geometry";

const SelectedLayout = layouts[config.layout];

export interface Toplevel {
  screen: number;
  desktop: number;
  layout: Layout;
  geometry: Geometry;
}

export function toplevel(screen: number, desktop: number): Toplevel {
  const geometry = workspace.clientArea(0, screen, desktop);

  geometry.y += gaps.size + config.margins.top;
  geometry.x += gaps.size + config.margins.left;

  geometry.height -= gaps.size * 2 + config.margins.top + config.margins.bottom;
  geometry.width -= gaps.size * 2 + config.margins.left + config.margins.right;

  const layout = new SelectedLayout(geometry);

  return {
    screen,
    desktop,
    layout,
    geometry
  };
}
