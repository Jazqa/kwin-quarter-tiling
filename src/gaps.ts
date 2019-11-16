import { config } from "./config";

var size: number = config.gaps;

const adjust = (amount: number): void => {
  // Note: Gap size can't be zero, because it would screw up the maximized window logic
  const min: number = 2;
  const max: number = 64;

  size = Math.min(Math.max(size + amount, min), max);
};

function increase(): void {
  adjust(2);
}

function decrease(): void {
  adjust(-2);
}

export const gaps = {
  size,
  increase,
  decrease
};
