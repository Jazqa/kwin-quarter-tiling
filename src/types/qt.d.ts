export interface QPoint {
  x: number;
  y: number;
}

export interface QSize {
  width: number;
  height: number;
}

export type QRect = QPoint & QSize;
