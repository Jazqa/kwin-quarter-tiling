import { Geometry } from "./geometry";

export interface ClientSignal {
  connect: (callback: (client: Client) => void) => void;
  disconnect: (callback: (client: Client) => void) => void;
}

export interface ClientFullScreenSignal {
  connect: (callback: (client: Client, fullScreen: boolean) => void) => void;
  disconnect: (callback: (client: Client, fullScreen: boolean) => void) => void;
}

export interface ClientMaximizeSignal {
  connect: (callback: (client: Client, h: boolean, v: boolean) => void) => void;
  disconnect: (callback: (client: Client, h: boolean, v: boolean) => void) => void;
}

export interface Client {
  readonly windowId: string;

  desktop: number;
  readonly screen: number;
  geometry: Geometry;

  readonly caption: string;
  readonly resourceClass: string;
  readonly resourceName: string;

  readonly comboBox: boolean;
  readonly desktopWindow: boolean;
  readonly dialog: boolean;
  readonly dndIcon: boolean;
  readonly dock: boolean;
  readonly dropdownMenu: boolean;
  readonly menu: boolean;
  readonly minimized: boolean;
  readonly notification: boolean;
  readonly popupMenu: boolean;
  readonly specialWindow: boolean;
  readonly splash: boolean;
  readonly toolbar: boolean;
  readonly tooltip: boolean;
  readonly utility: boolean;
  readonly transient: boolean;

  clientStartUserMovedResized: ClientSignal;
  clientFinishUserMovedResized: ClientSignal;
}
