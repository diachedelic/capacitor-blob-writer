import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'www/js/bundle.js',
    format: 'iife',
    name: 'bundle',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    typescript(),
  ]
};
