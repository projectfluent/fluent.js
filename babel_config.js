export default {
  babelrc: false,
  exclude: [
    /\/core-js\//
  ],
  presets: [
    ["@babel/preset-env", {
      // Cf. https://github.com/rollup/rollup-plugin-babel#modules
      modules: false,
      useBuiltIns: "usage",
      corejs: 3,
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
  ],
  plugins: []
};
