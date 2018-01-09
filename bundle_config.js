import acornAsyncIteration from 'acorn-async-iteration/inject';

export default {
  output: {
    format: 'umd'
  },
  acorn: {
    ecmaVersion: 9,
    plugins: { asyncIteration: true }
  },
  acornInjectPlugins: [
    acornAsyncIteration
  ]
};
