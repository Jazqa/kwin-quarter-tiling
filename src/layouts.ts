import { Columns } from "./layouts/Columns";
import { Full } from "./layouts/Full";
import { Rows } from "./layouts/Rows";

/*
 * Adding a new layout to the script:
 *
 *  1. Create a "src/layouts/LayoutName.ts" file
 *
 *  2. Write a Layout that implements Layout from "/src/types/layout.d.ts"
 *
 *  3. Import the new Layout and add it to the Layouts-array below
 *
 *  4. Add the following entry to each "kcfg_layout" element in "contents/code/config.ui"
 *
 *           <item>
 *             <property name="text">
 *               <string>NewLayout</string>
 *             </property>
 *           </item>
 *
 */

export const Layouts = [Full, Full, Full, Full, Full];
