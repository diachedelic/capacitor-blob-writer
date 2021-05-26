import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/plugin.js',
    format: 'iife',
    name: 'capacitorBlobWriter',
    globals: {
      '@capacitor/core': 'capacitorExports',
      '@capacitor/filesystem': 'capacitorFilesystems',
    },
    sourcemap: true,
  },
  external: ['@capacitor/core', '@capacitor/filesystem'],
  plugins: [
    nodeResolve(),
  ],
};
