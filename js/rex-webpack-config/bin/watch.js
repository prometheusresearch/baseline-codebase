#!/usr/bin/env node
const path = require("path");

const buildPath = path.resolve("build");
console.log(`Bundle will be saved to: ${buildPath}`);

process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

const configFactory = require("rex-webpack-config/webpack.config");
const webpack = require("webpack");
const clearConsole = require("react-dev-utils/clearConsole");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const chalk = require("chalk");
const { spawnSync } = require('child_process');


// Removing hot reloading
const config = configFactory('development');
config.entry.shift();
config.plugins = config.plugins.filter(
  p => !(p instanceof webpack.HotModuleReplacementPlugin),
);
config.output.path = buildPath;

let compiler = webpack(config);
let start = new Date().getTime();

compiler.plugin("invalid", function() {
  start = new Date().getTime();
  clearConsole();
  console.log("Compiling...");
});

compiler.plugin("done", function(stats) {
  let time = new Date().getTime() - start;
  let timeStr = `${time}`;
  let timeFormatted =
    (timeStr.substring(0, timeStr.length - 3) || "0") +
    "." +
    timeStr.substring(timeStr.length - 3, timeStr.length) +
    "s";

  clearConsole();

  var messages = formatWebpackMessages(stats.toJson({}, true));
  var isSuccessful = !messages.errors.length && !messages.warnings.length;

  if (isSuccessful) {
    // copy public/index.html
    //spawnSync("cp", ["public/index.html", "build/index.html"]);
    console.log(chalk.green("Compiled successfully!"));
    console.log(chalk.green(`Time taken: ${timeFormatted}`));
  }

  // If errors exist, only show errors.
  if (messages.errors.length) {
    console.log(chalk.red("Failed to compile."));
    console.log();
    messages.errors.forEach(message => {
      console.log(message);
      console.log();
    });
    return;
  }

  // Show warnings if no errors were found.
  if (messages.warnings.length) {
    console.log(chalk.yellow("Compiled with warnings."));
    console.log();
    messages.warnings.forEach(message => {
      console.log(message);
      console.log();
    });
    // Teach some ESLint tricks.
    console.log("You may use special comments to disable some warnings.");
    console.log(
      "Use " +
        chalk.yellow("// eslint-disable-next-line") +
        " to ignore the next line.",
    );
    console.log(
      "Use " +
        chalk.yellow("/* eslint-disable */") +
        " to ignore all warnings in a file.",
    );
    console.log();
    console.log(chalk.yellow(`Time taken: ${timeFormatted}`));
  }
});

compiler.watch({}, function() {});
