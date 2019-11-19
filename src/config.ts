export const readConfig: (key: string, defaultValue: any) => any =
  // @ts-ignore, KWin global
  readConfig ||
  function(key: string, defaultValue: any) {
    return defaultValue;
  };

function readConfigString(key: string, defaultValue: any): string {
  return readConfig(key, defaultValue).toString();
}

const ignoredCaptions: Array<string> = [
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
  ...readConfigString("ignoredClients", "wine, steam, kate").split(", ")
];

const ignoredClients: Array<string> = [
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  "QEMU",
  ...readConfigString("ignoredCaptions", "Quit GIMP, Create a New Image").split(", "),
  ...[readConfigString("ignoreJava", false) === "true" ? "sun-awt-x11-xframepeer" : ""]
];

const ignoredDesktops: Array<string> = readConfigString("ignoredDesktops", "").split(", ");
const ignoredScreens: Array<string> = readConfigString("ignoredScreens", "").split(", ");

const minWidth: number = readConfig("minWidth", 256);
const minHeight: number = readConfig("minHeight", 256);

const gaps: number = readConfig("gaps", 8);

const autoTile: boolean = readConfigString("autoTile", true) === "true";

const layout: string = readConfigString("layout", 0);

const margins: { top: number; left: number; bottom: number; right: number } = {
  top: readConfig("marginTop", 0),
  left: readConfig("marginLeft", 0),
  bottom: readConfig("marginBottom", 0),
  right: readConfig("marginRight", 0)
};

export const config = {
  ignoredCaptions,
  ignoredClients,
  ignoredDesktops,
  ignoredScreens,
  minWidth,
  minHeight,
  gaps,
  margins,
  autoTile,
  layout
};
