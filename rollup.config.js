import buble from 'rollup-plugin-buble';

export default {
  entry: 'test.js',
  plugins: [ 
    buble(),
  ],
};
