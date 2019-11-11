export default {
  babelrc: false,
  presets: [
    ["@babel/preset-env", {
      // Cf. https://github.com/rollup/rollup-plugin-babel#modules
      modules: false,
      targets: {
        browsers: [
          "ie >= 11",
        ]
      },
      exclude: [
        // Exclude regeneratorRuntime explicitly because babel-preset-env
        // incorrectly transpiles async functions for Firefox 52.
        // See https://github.com/babel/babel/issues/8086.
        "transform-regenerator"
      ],
    }]
  ]
};
