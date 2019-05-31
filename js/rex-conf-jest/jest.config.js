module.exports = {
  collectCoverageFrom: ["**/*.js"],
  // TODO: this is neede for pnp, enable when needed.
  // resolver: "jest-pnp-resolver",
  setupFiles: ["react-app-polyfill/jsdom"],
  testMatch: [
    "<rootDir>/**/__tests__/**/*-test.{js,jsx}",
    "<rootDir>/**/*.(spec|test).{js,jsx}"
  ],
  testEnvironment: "jsdom",
  testURL: "http://localhost",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    "^.+\\.css$": require.resolve("./cssTransform.js"),
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": require.resolve("./fileTransform.js")
  },
//transformIgnorePatterns: [
//  "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$",
//  "^.+\\.module\\.(css|sass|scss)$"
//],
  moduleNameMapper: {
    "^react-native$": "react-native-web",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy"
  },
  moduleFileExtensions: [
    "web.js",
    "js",
    "web.ts",
    "ts",
    "web.tsx",
    "tsx",
    "json",
    "web.jsx",
    "jsx",
    "node"
  ]
};
