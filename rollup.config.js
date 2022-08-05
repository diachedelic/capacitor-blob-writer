import node_resolve from "@rollup/plugin-node-resolve";

export default Object.freeze({
    input: "blob_writer.js",
    output: [
        {
            file: "blob_writer.umd.js",
            format: "umd",
            name: "capacitor_blob_writer",
            sourcemap: true,
            globals: {
                "@capacitor/core": "capacitorExports",
                "@capacitor/filesystem": "capacitorFilesystem"
            }
        }
    ],
    external: [
        "@capacitor/core",
        "@capacitor/filesystem"
    ],
    plugins: [node_resolve()]
});
