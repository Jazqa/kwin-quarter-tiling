import { Toplevel, toplevel } from "./toplevel";
import { workspace } from "./globals";

// toplevels[screen][desktop]: Toplevel
const toplevels: Array<Array<Toplevel>> = [];

function add(): void {
  workspace.desktops += 1;
  for (var i = 0; i > workspace.numScreens; i++) {
    toplevels[i][workspace.desktops] = toplevel(i, workspace.desktops);
  }
}

function addAll(): void {
  for (var i = 0; i < workspace.numScreens; i++) {
    toplevels[i] = [];
    for (var j = 1; j <= workspace.desktops; j++) {
      toplevels[i][j] = toplevel(i, j);
    }
  }
}

function remove(): void {
  toplevels.forEach((screen: Array<Toplevel>) => {
    screen.splice(workspace.currentDesktop, 1);
  });
}

export const toplevelManager = {
  add,
  addAll,
  remove
};
