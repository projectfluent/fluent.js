import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  context: 'this',
  plugins: [
    nodeResolve(),
    babel({
      'babelrc': false,
      'presets': [
        ['env', {
          'modules': false
        }]
      ],
      'plugins': [
        'external-helpers',
        ['babel-plugin-transform-builtin-extend', {
          globals: ['Error']
        }]
      ]
    }),
  ],
};
