import { Client, ClientSignal } from "./client";
import { Geometry } from "./geometry";

interface Options {
  windowSnapZone: number;
  electricBorderMaximize: boolean;
  electricBorderTiling: boolean;
}

export interface ClientFullScreenSignal {
  connect: (cb: (client: Client, fs: boolean) => void) => void;
  disconnect: (cb: (client: Client, fs: boolean) => void) => void;
}

export interface ClientMaximizeSignal {
  connect: (cb: (client: Client, h: boolean, v: boolean) => void) => void;
  disconnect: (cb: (client: Client, h: boolean, v: boolean) => void) => void;
}

interface DesktopPresenceChangeSignal {
  connect: (cb: (client: Client, desktop: number) => void) => void;
  disconnect: (cb: (client: Client, desktop: number) => void) => void;
}

interface CurrentDesktopChangedSignal {
  connect: (cb: (desktop: number, client: Client) => void) => void;
  disconnect: (cb: (desktop: number, client: Client) => void) => void;
}

interface ScreenResizedSignal {
  connect: (cb: (screen: number) => void) => void;
  disconnect: (cb: (screen: number) => void) => void;
}

interface ClientActivatedSignal {
  connect: (cb: (client: Client) => void) => void;
  disconnect: (cb: (client: Client) => void) => void;
}

interface NumberDesktopsChangedSignal {
  connect: (cb: (previousDesktops: number) => void) => void;
  disconnect: (cb: (previousDesktops: number) => void) => void;
}

interface Workspace {
  activeClient: Client;
  activateClient: (client: Client) => void;

  readonly activeScreen: number;
  readonly numScreens: number;

  desktops: number;
  currentDesktop: number;

  readonly currentActivity: string;

  clientList: () => Array<Client>;
  clientArea: (type: number, screenId: number, desktopId: number) => Geometry;

  clientAdded: ClientSignal;
  clientRemoved: ClientSignal;
  clientUnminimized: ClientSignal;
  clientMinimized: ClientSignal;
  clientMaximizeSet: ClientMaximizeSignal;
  clientFullScreenSet: ClientFullScreenSignal;
  clientActivated: ClientActivatedSignal;
  currentDesktopChanged: CurrentDesktopChangedSignal;
  desktopPresenceChanged: DesktopPresenceChangeSignal;
  screenResized: ScreenResizedSignal;
  numberDesktopsChanged: NumberDesktopsChangedSignal;
}

// @ts-ignore, KWin global
export const options: Options = options || {};

// @ts-ignore, KWin global
export const workspace: Workspace = workspace || {};
