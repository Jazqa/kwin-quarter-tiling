import { Client, ClientFullScreenSignal, ClientMaximizeSignal, ClientSignal } from "./client";
import { Geometry } from "./geometry";

interface Options {
  windowSnapZone: number;
  electricBorderMaximize: boolean;
  electricBorderTiling: boolean;
}

type DesktopPresenceChangedCb = (client: Client, desktop: number) => void;
interface DesktopPresenceChangeSignal {
  connect: (cb: DesktopPresenceChangedCb) => void;
  disconnect: (cb: DesktopPresenceChangedCb) => void;
}

type CurrentDesktopChangeCb = (desktop: number, client: Client) => void;
interface CurrentDesktopChangedSignal {
  connect: (cb: CurrentDesktopChangeCb) => void;
  disconnect: (cb: CurrentDesktopChangeCb) => void;
}

interface Workspace {
  readonly activeClient: Client;
  readonly activeScreen: number;

  readonly numScreens: number;

  desktops: number;
  currentDesktop: number;

  clientList: () => Array<Client>;
  clientArea: (type: number, screenId: number, desktopId: number) => Geometry;

  clientAdded: ClientSignal;
  clientRemoved: ClientSignal;
  clientMaximizeSet: ClientMaximizeSignal;
  clientFullScreenSet: ClientFullScreenSignal;
  clientUnminimized: ClientSignal;
  clientMinimized: ClientSignal;
  currentDesktopChanged: CurrentDesktopChangedSignal;
  desktopPresenceChanged: DesktopPresenceChangeSignal;
}

// @ts-ignore, KWin global
export const options: Options = options || {};

// @ts-ignore, KWin global
export const workspace: Workspace = workspace || {};
