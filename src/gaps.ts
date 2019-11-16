import { config } from "./config";

export var gaps: number = config.gaps;

const adjustGaps = (amount: number): void => {
  // Note: Gap size can't be zero, because it would screw up the maximized window logic
  const minGaps: number = 2;
  const maxGaps: number = 64;

  gaps = Math.min(Math.max(gaps + amount, minGaps), maxGaps);
};

export function increaseGap(): void {
  adjustGaps(2);
}

export function decreaseGap(): void {
  adjustGaps(-2);
}
