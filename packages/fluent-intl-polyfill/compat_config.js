import compatConfig from '../compat_config';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default Object.assign({}, compatConfig, {
  context: 'this',
  plugins: [
    nodeResolve(),
    ...compatConfig.plugins
  ],
});
