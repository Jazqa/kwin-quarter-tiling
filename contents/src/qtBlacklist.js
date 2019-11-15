// @flow
import { kwReadConfig, kwReadConfigString, kwWorkspace } from "./kwGlobals";
import type { KWClient } from "./kwTypes";

const captionBlacklist = [
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  "QEMU",
  ...kwReadConfigString("ignoredCaptions", "Quit GIMP, Create a New Image").split(", "),
  ...[kwReadConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]
];

const clientBlacklist = [
  "albert",
  "kazam",
  "krunner",
  "ksmserver",
  "lattedock",
  "pinentry",
  "Plasma",
  "plasma",
  "plasma-desktop",
  "plasmashell",
  "plugin-container",
  "simplescreenrecorder",
  "yakuake",
  ...kwReadConfigString("ignoredClients", "wine, steam, kate").split(", ")
];

const minWidth = kwReadConfig("minWidth", 256);
const minHeight = kwReadConfig("minHeight", 256);

export const isEligible = (client: KWClient): boolean => {
  const isFullScreen =
    client.geometry.width === kwWorkspace.clientArea(0, client.screen, 0).width &&
    client.geometry.height === kwWorkspace.clientArea(0, client.screen, 0).height;

  return isFullScreen ||
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
    client.geometry.width < minWidth ||
    client.geometry.height < minHeight ||
    captionBlacklist.indexOf(client.caption.toString()) > -1 ||
    clientBlacklist.indexOf(client.resourceClass.toString()) > -1 ||
    clientBlacklist.indexOf(client.resourceName.toString()) > -1
    ? false
    : true;
};
