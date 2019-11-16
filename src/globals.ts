import { Client, ClientFullScreenSignal, ClientMaximizeSignal, ClientSignal } from "./client";
import { Geometry } from "./geometry";

interface Options {
  windowSnapZone: number;
  electricBorderMaximize: boolean;
  electricBorderTiling: boolean;
}

interface WorkspaceSignal {
  connect: () => void;
  disconnect: () => void;
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
  currentDesktopChanged: WorkspaceSignal;
  desktopPresenceChanged: WorkspaceSignal;
}

// @ts-ignore, KWin global
export const options: Options = options || {};

// @ts-ignore, KWin global
export const workspace: Workspace = workspace || {};
