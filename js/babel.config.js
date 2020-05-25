let plugins = process.env.REACT_STORYBOOK === "true" ? ["react-docgen"] : [];

module.exports = {
  env: {
    production: {
      presets: ["react-app"],
    },
    development: {
      presets: ["react-app"],
    },
    test: {
      presets: [["@babel/preset-env", { targets: { ie: 9 } }], "react-app"],
    },
  },
  plugins,
};
