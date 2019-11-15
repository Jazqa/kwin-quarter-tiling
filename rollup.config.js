import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "contents/compiled/index.js",
  output: {
    file: "contents/code/main.js",
    format: "cjs"
  },
  plugins: [resolve(), commonjs()]
};
