import bundleConfig from '../bundle_config';
import nodeResolve from 'rollup-plugin-node-resolve';

export default Object.assign({}, bundleConfig, {
  output: {
    format: 'iife'
  },
  context: 'this',
  plugins: [
    nodeResolve(),
  ]
});
