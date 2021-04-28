const path = require("path");

let PATH_TS = path.resolve(__dirname, "./stories");
let PATH_TSCONFIG = path.resolve(__dirname, "./tsconfig.json");

module.exports = (baseConfig, env) => {
  let { config } = baseConfig;

  let shallowRules = { ...config.module.rules[0] };

  /**
   * Some hacks to make things work...
   */
  config.module.rules[0] = {
    test: /\.tsx?$/,
    include: PATH_TS,
    exclude: shallowRules.exclude,
    use: [
      require.resolve("ts-loader"),
      {
        loader: require.resolve("react-docgen-typescript-loader"),
        options: {
          // Provide the path to our tsconfig.json
          tsconfigPath: PATH_TSCONFIG,
          setDisplayName: false,
        },
      },
    ],
  };

  config.module.rules.unshift({
    ...shallowRules,
    test: /\.jsx?$/,
  });

  return config;
};
