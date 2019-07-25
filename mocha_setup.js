"use strict";

require("@babel/polyfill");
require("@babel/register")({
  ignore: [
    // Ignore node_modules other than own Fluent dependencies.
    path => /node_modules/.test(path)
      && !/node_modules\/@fluent/.test(path)
  ],
  plugins: [
    "@babel/plugin-proposal-async-generator-functions",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-transform-modules-commonjs"
  ]
});
