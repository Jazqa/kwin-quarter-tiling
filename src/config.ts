import { workspace } from "./kwin";
import { KWinOutput, KWinVirtualDesktop } from "./types/kwin";
import { readConfig, readConfigString } from "./kwin";
import math from "./math";

interface Margin {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const auto: boolean = readConfigString("auto", true) === "true";

const follow: boolean = readConfigString("follow", true) === "true";

const gap: Array<number> = [
  readConfig("gap_0", 8),
  readConfig("gap_1", 8),
  readConfig("gap_2", 8),
  readConfig("gap_3", 8),
];

const margin: Array<Margin> = [
  {
    top: readConfig("marginTop_0", 0),
    left: readConfig("marginLeft_0", 0),
    bottom: readConfig("marginBottom_0", 0),
    right: readConfig("marginRight_0", 0),
  },
  {
    top: readConfig("marginTop_1", 0),
    left: readConfig("marginLeft_1", 0),
    bottom: readConfig("marginBottom_1", 0),
    right: readConfig("marginRight_1", 0),
  },
  {
    top: readConfig("marginTop_2", 0),
    left: readConfig("marginLeft_2", 0),
    bottom: readConfig("marginBottom_2", 0),
    right: readConfig("marginRight_2", 0),
  },
  {
    top: readConfig("marginTop_3", 0),
    left: readConfig("marginLeft_3", 0),
    bottom: readConfig("marginBottom_3", 0),
    right: readConfig("marginRight_3", 0),
  },
];

const layout = [
  readConfigString("layout_0", 1),
  readConfigString("layout_1", 1),
  readConfigString("layout_2", 1),
  readConfigString("layout_3", 1),
];

const limit: Array<number> = [
  readConfig("limit_0", -1),
  readConfig("limit_1", -1),
  readConfig("limit_2", -1),
  readConfig("limit_3", -1),
];

const minWidth: number = readConfig("minWidth", 256);
const minHeight: number = readConfig("minHeight", 256);

const processes: Array<string> = [
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
  ...readConfigString("processes", "wine, steam").toLowerCase().split(", "),
  ...[readConfigString("java", false) === "true" ? "sun-awt-x11-xframepeer" : ""],
];

const captions: Array<string> = [
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  ...readConfigString("captions", "Quit GIMP, Create a New Image")
    .toLowerCase()
    .split(", ")
    .filter((caption) => caption),
];

const desktops: Array<string> = readConfigString("desktops", "").split(", ");

const exclude = function (output: KWinOutput, desktop: KWinVirtualDesktop) {
  // 04c1
  // layout[math.outputIndex(output)] ===  "DISABLED"
  return desktops.indexOf(math.desktopIndex(desktop).toString()) > -1;
};

export default {
  auto,
  follow,
  gap,
  margin,
  layout,
  limit,
  minWidth,
  minHeight,
  processes,
  captions,
  desktops,
  exclude,
};
