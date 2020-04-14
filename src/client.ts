import { Geometry } from "./geometry";

export interface VoidSignal {
  connect: (cb: () => void) => void;
  disconnect: (cb: () => void) => void;
}

export interface ClientSignal {
  connect: (cb: (client: Client) => void) => void;
  disconnect: (cb: (client: Client) => void) => void;
}

export interface Client {
  readonly windowId: string;

  desktop: number;
  readonly screen: number;
  geometry: Geometry;
  readonly activities: Array<string>;

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
  readonly shade: boolean;

  clientStartUserMovedResized: ClientSignal;
  clientFinishUserMovedResized: ClientSignal;

  screenChanged: VoidSignal;
  desktopChanged: VoidSignal;
  shadeChanged: VoidSignal;
}
