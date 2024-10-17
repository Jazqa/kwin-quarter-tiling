import { workspace } from "./kwin";
import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";

const readConfig: (key: string, defaultValue: any) => any =
  // @ts-ignore, KWin global
  readConfig ||
  function (key: string, defaultValue: any) {
    return defaultValue;
  };

function readConfigString(key: string, defaultValue: any): string {
  return readConfig(key, defaultValue).toString();
}

const gaps: number = readConfig("gap", 8);

const margins: { top: number; left: number; bottom: number; right: number } = {
  top: readConfig("marginTop", 0),
  left: readConfig("marginLeft", 0),
  bottom: readConfig("marginBottom", 0),
  right: readConfig("marginRight", 0),
};

const layout: string = readConfigString("layout", 0);

const autoTile: boolean = readConfigString("autoTile", true) === "true";

const followWindows: boolean = readConfigString("followClients", true) === "true";

const minWidth: number = readConfig("minWidth", 256);
const minHeight: number = readConfig("minHeight", 256);

const maxWindows: number = readConfig("maxClients", -1);

const ignoredWindows: Array<string> = [
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
  "ksmserver-logout-greeter",
  "QEMU",
  "Latte Dock",
  ...readConfigString("ignoredClients", "wine, steam").split(", "),
  ...[readConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""],
];

const ignoredCaptions: Array<string> = [
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  ...readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image")
    .split(", ")
    .filter((caption) => caption),
];

const ignoredDesktops: Array<string> = readConfigString("ignoredDesktops", "").split(", ");
const ignoredOutputs: Array<string> = readConfigString("ignoredScreens", "").split(", ");

function isIgnoredDesktop(desktop: KWinVirtualDesktop) {
  const index = workspace.desktops.findIndex(({ id }) => id === desktop.id);
  return ignoredDesktops.indexOf(index.toString()) > -1;
}

function isIgnoredOutput(output: KWinOutput) {
  const index = workspace.screens.findIndex(({ serialNumber }) => serialNumber === output.serialNumber);
  return ignoredOutputs.indexOf(index.toString()) > -1;
}

function isIgnoredLayer(output: KWinOutput, desktop: KWinVirtualDesktop) {
  return isIgnoredOutput(output) || isIgnoredDesktop(desktop);
}

export default {
  gaps,
  margins,
  layout,
  autoTile,
  followWindows,
  minWidth,
  minHeight,
  maxWindows,
  ignoredWindows,
  ignoredCaptions,
  ignoredDesktops,
  ignoredOutputs,
  isIgnoredDesktop,
  isIgnoredOutput,
  isIgnoredLayer,
};
