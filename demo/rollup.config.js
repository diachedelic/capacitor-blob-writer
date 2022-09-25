import node_resolve from "@rollup/plugin-node-resolve";

export default Object.freeze({
    input: "demo.js",
    output: {
        file: "www/js/bundle.js",
        format: "iife",
        name: "bundle",
        sourcemap: true,
        inlineDynamicImports: true
    },
    plugins: [node_resolve()]
});
