import babel from "rollup-plugin-babel";
import compatConfig from "../compat_config";
import babelConfig from "../babel_config";

export default {
  ...compatConfig,
  plugins: [
    ...compatConfig.plugins,
    babel({
      ...babelConfig,
      plugins: [
        ...babelConfig.plugins,
        ["babel-plugin-transform-rename-import", {
          replacements: [
            {
              original: "fluent-sequence",
              replacement: "fluent-sequence/compat",
            },
            {
              original: "cached-iterable",
              replacement: "cached-iterable/compat",
            },
          ]
        }],
      ]
    }),
  ],
};
