// Jest requires us to specify the transforms it needs to run the tests
module.exports = {
  "presets": [
    "@babel/preset-react",
    ["@babel/preset-env", {
      "targets": "node >= 10.0.0"
    }]
  ],
  "plugins": [
    ["babel-plugin-transform-rename-import", {
      "original": "fluent",
      "replacement": "fluent/compat"
    }]
  ],
};
