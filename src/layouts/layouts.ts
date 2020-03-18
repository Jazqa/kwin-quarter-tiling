import { QuarterHorizontal } from "./quarterHorizontal";
import { QuarterSingleHorizontal } from "./quarterSingleHorizontal";
import { QuarterSingleVertical } from "./quarterSingleVertical";
import { QuarterVertical } from "./quarterVertical";

/*
 * Adding a new layout to the script and its options:
 *
 *  1. Create a new class that inside src/layouts folder, make sure it implements the Layout interface as seen in /src/layout.ts
 *  2. Add an entry to the layouts object in src/layouts/layouts.ts, increasing the key by one:
 *      { "0": QuarterVertical, "1": NewLayout }
 *  3. Add a new entry to the kcfg_layouts entry in contents/code/config.ui:
 *      <property name="text">
 *          <string>NewLayout</string>
 *      </property>
 */

export const layouts = {
  "0": QuarterHorizontal,
  "1": QuarterVertical,
  "2": QuarterSingleHorizontal,
  "3": QuarterSingleVertical
};
