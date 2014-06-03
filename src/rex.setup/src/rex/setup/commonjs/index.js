'use strict';

var path       = require('path');
var webpack    = require('webpack');
var LessPlugin = require('webpack-less-asset-plugin');

var global_modules = path.join(
  process.env.NPM_CONFIG_PREFIX,
  'lib/bower_components');


function global(p) {
  return path.join(global_modules, p);
}

function configureWebpack(config) {
  set(config, 'watchDelay', 800);

  set(config, 'output.path', process.cwd());
  set(config, 'output.filename', 'bundle.js');
  unshift(config, 'module.loaders', [
    {
      test: /\.js$/,
      loader: 'jsx-loader?harmony=true',
      exclude: [
        /react\/react\.js$/,
        /react\/react-with-addons\.js$/
      ]
    },
    {
      test: /\.less$/,
      loader: require.resolve('webpack-less-asset-plugin/loader')
    }
  ]);
  unshift(config, 'module.noParse', [
    /react\/react\.js$/,
    /react\/react-with-addons\.js$/
  ]);

  unshift(config, 'resolveLoader.root', process.env.NODE_PATH);

  set(config, 'resolve.alias.react/addons', global('react/react-with-addons.js'));
  set(config, 'resolve.alias.react', global('react/react-with-addons.js'));
  unshift(config, 'resolve.root', global_modules);
  set(config, 'resolve.modulesDirectories', []);
  unshift(config, 'resolve.extensions', ['', '.js']);

  unshift(config, 'plugins' ,[
    new LessPlugin({
      root: process.cwd(),
      less: {paths: [global_modules]},
      filename: 'bundle.css'
    }),
    new webpack.ResolverPlugin([
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
        "bower.json", ["main"])
    ], ["normal"])
  ]);
  return config;
}

function set(config, path, defaultValue) {
  path = path.split('.');
  path.forEach(function(p, idx) {
    if (idx === path.length - 1 && config[p] === undefined) {
      config[p] = defaultValue;
    } else {
      config[p] = config[p] || {};
      config = config[p];
    }
  });
}

function unshift(config, path, defaultValue) {
  path = path.split('.');
  path.forEach(function(p, idx) {
    if (idx === path.length - 1) {
      if (config[p] === undefined) {
        config[p] = [];
      } else if (!Array.isArray(config[p])) {
        throw new Error('invalid webpack config: ' + path + ' should be an array');
      }
      if (Array.isArray(defaultValue)) {
        config[p] = defaultValue.concat(config[p]);
      } else {
        config[p].unshift(defaultValue);
      }
    } else {
      config[p] = config[p] || {};
      config = config[p];
    }
  });
}

module.exports = {
  configureWebpack: configureWebpack
};
