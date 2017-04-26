import babel from 'rollup-plugin-babel';

export default {
  plugins: [
    babel({
      'babelrc': false,
      'presets': [
        ['latest', {
          'es2015': {
            'modules': false
          }
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
