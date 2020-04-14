import { Client } from "./client";
import { config } from "./config";
import { workspace } from "./globals";

function includes(client: Client): boolean {
  const isMaximized: boolean =
    client.geometry.width === workspace.clientArea(0, client.screen, 0).width &&
    client.geometry.height === workspace.clientArea(0, client.screen, 0).height;

  return isMaximized ||
    client.comboBox ||
    client.desktopWindow ||
    client.dialog ||
    client.dndIcon ||
    client.dock ||
    client.dropdownMenu ||
    client.menu ||
    client.minimized ||
    client.notification ||
    client.popupMenu ||
    client.specialWindow ||
    client.splash ||
    client.toolbar ||
    client.tooltip ||
    client.utility ||
    client.transient ||
    client.desktop < 1 ||
    client.screen < 0 ||
    client.geometry.width < config.minWidth ||
    client.geometry.height < config.minHeight ||
    config.ignoredCaptions.some(
      caption =>
        client.caption
          .toString()
          .toLowerCase()
          .indexOf(caption.toLowerCase()) > -1
    ) ||
    config.ignoredClients.indexOf(client.resourceClass.toString()) > -1 ||
    config.ignoredClients.indexOf(client.resourceName.toString()) > -1 ||
    config.isIgnoredDesktop(client.desktop) ||
    config.isIgnoredScreen(client.screen)
    ? true
    : false;
}

export const blacklist = {
  includes
};
