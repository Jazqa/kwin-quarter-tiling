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

const layouts = [
  readConfigString("layout_0", 0),
  readConfigString("layout_1", 0),
  readConfigString("layout_2", 0),
  readConfigString("layout_3", 0),
];

const maxWindows: Array<number> = [
  readConfig("maxWindows_0", -1),
  readConfig("maxWindows_1", -1),
  readConfig("maxWindows_2", -1),
  readConfig("maxWindows_3", -1),
];

const outputEnabled: Array<boolean> = [
  readConfig("outputEnabled_0", -1),
  readConfig("outputEnabled_1", -1),
  readConfig("outputEnabled_2", -1),
  readConfig("outputEnabled_3", -1),
];

const autoTile: boolean = readConfigString("autoTile", true) === "true";

const followWindows: boolean = readConfigString("followWindows", true) === "true";

const minWidth: number = readConfig("minWidth", 256);
const minHeight: number = readConfig("minHeight", 256);

const ignoredProcesses: Array<string> = [
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
  ...readConfigString("ignoredProcesses", "wine, steam").split(", "),
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

function isIgnoredDesktop(desktop: KWinVirtualDesktop) {
  const index = workspace.desktops.findIndex(({ id }) => id === desktop.id);
  return ignoredDesktops.indexOf(index.toString()) > -1;
}

function isOutputEnabled(output: KWinOutput) {
  const index = workspace.screens.findIndex(({ serialNumber }) => serialNumber === output.serialNumber);
  return outputEnabled[index];
}

function isIgnoredLayer(output: KWinOutput, desktop: KWinVirtualDesktop) {
  return !isOutputEnabled(output) || isIgnoredDesktop(desktop);
}

export default {
  gaps,
  margins,
  layouts,
  autoTile,
  followWindows,
  minWidth,
  minHeight,
  maxWindows,
  ignoredProcesses,
  ignoredCaptions,
  ignoredDesktops,
  isIgnoredDesktop,
  isIgnoredLayer,
};
