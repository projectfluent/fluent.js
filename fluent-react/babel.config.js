// Jest requires us to specify the transforms it needs to run the tests
module.exports = {
  presets: [
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        targets: "node >= 12.0.0",
      },
    ],
  ],
};
