import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'umd',
      name: 'capacitorBlobWriter',
      sourcemap: true
    },

    {
      file: 'dist/plugin.mjs',
      format: 'es',
      sourcemap: true
    },
  ],
  plugins: [
    nodeResolve(),
    typescript()
  ]
};
