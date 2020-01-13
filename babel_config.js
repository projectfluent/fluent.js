export default {
  babelrc: false,
  presets: [
    ["@babel/preset-env", {
      // Cf. https://github.com/rollup/rollup-plugin-babel#modules
      modules: false,
      targets: {
        browsers: [
          "Firefox >= 52",
          "FirefoxAndroid >= 52",
          "Chrome >= 55",
          "ChromeAndroid >= 55",
          "Edge >= 15",
          "Safari >= 10.1",
          "iOS >= 10.3",
        ],
        node: "10.0.0",
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
