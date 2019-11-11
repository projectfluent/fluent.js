import babel from 'rollup-plugin-babel';
import babelConfig from './babel_config';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  output: {
    format: 'amd'
  },
  plugins: [
    babel(babelConfig),
    resolve(),
    commonjs()
  ],
};
