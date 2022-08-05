import typescript from "rollup-plugin-typescript2";
import node_resolve from "@rollup/plugin-node-resolve";

export default Object.freeze({
    input: "src/index.ts",
    output: {
        file: "www/js/bundle.js",
        format: "iife",
        name: "bundle",
        sourcemap: true,
        inlineDynamicImports: true
    },
    plugins: [
        node_resolve(),
        typescript()
    ]
});
