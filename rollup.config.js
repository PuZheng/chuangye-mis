import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import string from 'rollup-plugin-string';

export default {
  entry: 'src/main.js',
  plugins: [ 
    nodeResolve({
      jsnext: true,
      browser: true,
    }),
    commonjs(),
    string({
      include: 'js/template/*.ejs',
    }),
    buble(),
  ],
  targets: [
    { dest: 'js/bundle.js', format: 'es' }
  ]
};
