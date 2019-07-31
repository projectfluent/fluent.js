module.exports = {
  "presets": [
    "@babel/preset-react",
    ["@babel/preset-env", {
      "targets": "node >= 8.9.0"
    }]
  ],
  "plugins": [
    ["babel-plugin-transform-rename-import", {
      "original": "fluent",
      "replacement": "fluent/compat"
    }],
    "@babel/plugin-proposal-async-generator-functions"
  ],
};
