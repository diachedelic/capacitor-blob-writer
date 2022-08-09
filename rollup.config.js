import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/plugin.umd.js',
      format: 'umd',
      name: 'capacitorBlobWriter',
      sourcemap: true,
      globals: {
        '@capacitor/core': 'capacitorExports',
      },
    },

    {
      file: 'dist/plugin.esm.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: ['@capacitor/core'],
  plugins: [
    nodeResolve(),
    typescript(),
  ],
};
