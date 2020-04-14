import resolve from "rollup-plugin-node-resolve";

export default {
  input: "bin/index.js",
  output: {
    file: "contents/code/main.js",
    format: "cjs"
  },
  plugins: [resolve()]
};
