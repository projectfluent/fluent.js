import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  context: 'this',
  plugins: [
    nodeResolve(),
  ]
};
