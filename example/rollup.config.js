import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'www/js/bundle.js',
    format: 'iife',
    name: 'bundle',
    sourcemap: true
  },
  plugins: [
    nodeResolve()
  ]
};
