import { config } from "./config";
import { workspace } from "./globals";
import { Layout } from "./layout";
import { layouts } from "./layouts/layouts";
import { gaps } from "./gaps";

const SelectedLayout = layouts[config.layout];

export interface Toplevel {
  screen: number;
  desktop: number;
  layout: Layout;
}

export function toplevel(screen: number, desktop: number): Toplevel {
  var { x, y, width, height } = workspace.clientArea(0, screen, desktop);

  y += gaps.size + config.margins.top;
  x += gaps.size + config.margins.left;

  height -= gaps.size * 2 + config.margins.top + config.margins.bottom;
  width -= gaps.size * 2 + config.margins.left + config.margins.right;

  const layout = new SelectedLayout({ x, y, width, height });

  return {
    screen,
    desktop,
    layout
  };
}
