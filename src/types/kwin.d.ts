import { QPoint, QRect, QSize } from "./qt";

export interface KWinWorkspaceWrapper {
  activities: Array<string>;
  desktops: Array<KWinVirtualDesktop>;
  screens: Array<KWinOutput>;
  stackingOrder: Array<KWinWindow>;
  activeWindow: KWinWindow;

  currentDesktop: KWinVirtualDesktop;

  clientArea: (option: 2, output: KWinOutput, desktop: KWinVirtualDesktop) => QRect;

  currentDesktopChanged: {
    connect: (cb: (oldDesktop: KWinVirtualDesktop) => void) => void;
    disconnect: (cb: (oldDesktop: KWinVirtualDesktop) => void) => void;
  };
  windowAdded: {
    connect: (cb: (window: KWinWindow) => void) => void;
    disconnect: (cb: (window: KWinWindow) => void) => void;
  };
  windowRemoved: {
    connect: (cb: (window: KWinWindow) => void) => void;
    disconnect: (cb: (window: KWinWindow) => void) => void;
  };
  windowActivated: {
    connect: (cb: (window: KWinWindow) => void) => void;
    disconnect: (cb: (window: KWinWindow) => void) => void;
  };
}

export interface KWinOutput {
  geometry: QRect;
  serialNumber: string;
}

export interface KWinVirtualDesktop {
  id: string;
}

export interface KWinWindow {
  readonly pos: QPoint;
  readonly size: QSize;
  readonly rect: QRect;

  readonly output: KWinOutput;

  readonly resourceName: string;
  readonly resourceClass: string;

  readonly normalWindow: boolean;
  readonly managed: boolean;

  readonly stackingOrder: number;

  readonly active: boolean;

  readonly caption: string;

  readonly minSize: QSize;
  readonly maxSize: QSize;

  readonly internalId: string;

  readonly maximizable: boolean;
  readonly moveable: boolean;
  readonly resizeable: boolean;

  readonly move: boolean;
  readonly resize: boolean;

  fullScreen: boolean;
  desktops: Array<KWinVirtualDesktop>;
  onAllDesktops: boolean;
  minimized: boolean;

  frameGeometry: QRect;

  frameGeometryChanged: {
    connect: (cb: (rect: QRect) => void) => void;
    disconnect: (cb: (rect: QRect) => void) => void;
  };
  moveResizedChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
  fullScreenChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
  maximizedChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
  minimizedChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
  outputChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
  desktopsChanged: {
    connect: (cb: () => void) => void;
    disconnect: (cb: () => void) => void;
  };
}
