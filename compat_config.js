import babel from 'rollup-plugin-babel';

export default {
  output: {
    format: 'umd'
  },
  plugins: [
    babel({
      'babelrc': false,
      'presets': [
        'stage-3',
        ['env', {
          // Cf. https://github.com/rollup/rollup-plugin-babel#modules
          'modules': false,
          'targets': {
            'browsers': [
              '>1%',
              'last 4 versions',
              'Firefox ESR',
              'not ie < 9'
            ]
          }
        }]
      ],
      'plugins': [
        // Cf. https://github.com/rollup/rollup-plugin-babel#helpers
        'external-helpers',
        ['babel-plugin-transform-builtin-extend', {
          globals: ['Error']
        }]
      ]
    }),
  ],
};
