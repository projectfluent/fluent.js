import babel from 'rollup-plugin-babel';
import babelConfig from './babel_config';

export default {
  output: {
    format: 'umd'
  },
  plugins: [
    babel(babelConfig),
  ],
};
