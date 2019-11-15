// @flow

export type KWOptions = {
  windowSnapZone: number,
  electricBorderMaximize: boolean,
  electricBorderTiling: boolean
};

export type KWWorkspace = {
  activeClient: KWClient,
  activeScreen: number,
  numScreens: number,
  currentDesktop: number,
  desktops: number,
  clientArea: (type: number, screenId: number, desktopId: number) => KWGeometry
};

export type KWGeometry = {
  x: number,
  y: number,
  width: number,
  height: number
};

type KWSignal = {
  connect: Function,
  disconnect: Function
};

export type KWClient = {
  caption: string,
  resourceClass: string,
  resourceName: string,
  geometry: KWGeometry,
  screen: number,
  desktop: number,
  windowId: string,

  comboBox: boolean,
  desktopWindow: boolean,
  dialog: boolean,
  dndIcon: boolean,
  dock: boolean,
  dropdownMenu: boolean,
  menu: boolean,
  minimized: boolean,
  notification: boolean,
  popupMenu: boolean,
  specialWindow: boolean,
  splash: boolean,
  toolbar: boolean,
  tooltip: boolean,
  utility: boolean,
  transient: boolean,

  clientStartUserMovedResized: KWSignal,
  clientFinishUserMovedResized: KWSignal
};
