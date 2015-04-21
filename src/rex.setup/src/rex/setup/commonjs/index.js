'use strict';

var fs                   = require('fs');
var path                 = require('path');
var webpack              = require('webpack');
var ExtractTextPlugin    = require('extract-text-webpack-plugin');
var IntrospectablePlugin = require('rex-setup/introspection/plugin');

var introspectionLoader  = require.resolve('./introspection/loader');

var DEV           = !!process.env.REX_SETUP_DEV;
var BUNDLE_PREFIX = process.env.REX_SETUP_BUNDLE_PREFIX || '/bundle/';

var cwd = process.cwd();
var packageDirectory = path.join(cwd, 'bower_components');

function getPackageMetadata(directory) {
  var packageMetadataFilename = path.join(directory, 'bower.json');
  if (!fs.existsSync(packageMetadataFilename)) {
    return null;
  }
  var src = fs.readFileSync(packageMetadataFilename, 'utf8');
  return JSON.parse(src);
}

function getListOfDependencies(packageMetadata) {
  if (!packageMetadata || !packageMetadata.dependencies) {
    return [];
  }
  var dependencies = Object.keys(packageMetadata.dependencies)
    .map(packagePath)
    .map(getPackageMetadata)
    .filter(Boolean);
  return unique(dependencies.concat(concat(dependencies.map(getListOfDependencies))));
}

/**
 * Return path to an installed package specified by name.
 *
 * @param {String} name Name of the installed package
 * @returns {String} Path to the installed package
 */
function packagePath(name) {
  return path.join(packageDirectory, name);
}

/**
 * Produce WebPack configuration.
 *
 * @param {WebPackConfiguration} config WebPack configuration override
 * @returns {WebPackConfiguration}
 */
function configureWebpack(config) {
  var pkg = getPackageMetadata(cwd);
  var deps = getListOfDependencies(pkg);

  // add style entry either via rex.style key in package metadata or implicitly
  if (pkg.rex && pkg.rex.style) {
    addEntry(config, path.join(cwd, pkg.rex.style));
  } else if (pkg.styleEntry) {
    addEntry(config, path.join(cwd, pkg.styleEntry));
  } else {
    var indexLess = path.join(cwd, 'style', 'index.less');
    if (fs.existsSync(indexLess)) {
      addEntry(config, indexLess);
    }
  }

  // add entry for each introspectable package in dependency chain
  deps.forEach(function(pkg) {
    if (pkg.rex && pkg.rex.bundleAll) {
      addEntry(config, 'rex-setup/introspection/loader?all!' + pkg.name);
    }
  });

  // add package entry point
  if (pkg.rex && pkg.rex.bundleAll) {
    addEntry(config, 'rex-setup/introspection/loader?all!' + cwd);
  } else {
    addEntry(config, cwd);
  }

  set(config, 'watchDelay', 200);

  // set aliases for Node built-ins
  setResolveAliases(config, {
    'util': require.resolve('webpack/node_modules/node-libs-browser/node_modules/util/util.js'),
    'console': require.resolve('webpack/node_modules/node-libs-browser/node_modules/console-browserify'),
    'date-now': require.resolve('webpack/node_modules/node-libs-browser/node_modules/console-browserify/node_modules/date-now'),
    'inherits': require.resolve('webpack/node_modules/node-libs-browser/node_modules/util/node_modules/inherits/inherits_browser.js'),
    'is-array': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/is-array'),
    'ieee754': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/ieee754'),
    'base64-js': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/base64-js')
  });

  // set aliases for either bower or npm distribution of React
  if (fs.existsSync(packagePath('react/react-with-addons.js'))) {
    // because we want to bundle React once for addons and non-addons requires
    setResolveAliases(config, {
      'react/addons': packagePath('react/react-with-addons.js'),
      'react': packagePath('react/react-with-addons.js')
    });
  } else {
    // just to be consistent with bower version
    setResolveAliases(config, {
      'react/addons': packagePath('react/addons.js'),
      'react': packagePath('react/addons.js')
    });
  }

  setResolveAliasesFromPackages(config, [pkg].concat(deps));

  set(config, 'output.path', process.cwd());
  set(config, 'output.filename', 'bundle.js');
  unshift(config, 'module.loaders', [
    {
      test: /\.js$/,
      loader: 'jsx-loader?harmony=true&es5=true&stripTypes=true'
    },
    { test: /\.less$/,
      loaders: [
        ExtractTextPlugin.loader(),
        'css-loader',
        'less-loader'
      ]
    },
    { test: /\.css$/,
      loaders: [
        ExtractTextPlugin.loader(),
        'css-loader'
      ]
    },
    { test: /\.png$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.jpg$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.gif$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.eot$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.ttf$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.svg$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.woff$/, loader: 'url-loader?prefix=font/&limit=5000' },
		{ test: /\.woff2$/, loader: 'url-loader?prefix=font/&limit=5000' }
  ]);

  unshift(config, 'resolveLoader.root', process.env.NODE_PATH);
  unshift(config, 'resolveLoader.root', path.join(process.cwd(), 'node_modules'));

  unshift(config, 'resolve.root', packageDirectory);
  set(config, 'resolve.modulesDirectories', []);
  unshift(config, 'resolve.extensions', ['', '.js']);

  unshift(config, 'plugins' ,[
    new ExtractTextPlugin('bundle.css'),
    new webpack.ResolverPlugin([
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin(
        'bower.json', ['main'])
    ], ['normal']),
    new webpack.DefinePlugin({
      // used to guard code to run only in development
      __DEV__: DEV,
      // bundle prefix
      __BUNDLE_PREFIX__: JSON.stringify(BUNDLE_PREFIX),
      // defined as a fallback, should be defined at runtime
      __MOUNT_PREFIX__: '(typeof __MOUNT_PREFIX__ === "undefined" ? "" : __MOUNT_PREFIX__)',
      // React relies on that
      'process.env': {NODE_ENV: JSON.stringify(DEV ? 'development' : 'production')}
    }),
    new IntrospectablePlugin(),
  ]);

  return config;
}

function setResolveAliasesFromPackages(config, packages) {
  // TODO: we need to check for conflicts here but let's not bother now as we
  // don't want to advertise the feature
  packages.forEach(function(pkg) {
    if (pkg.rex && pkg.rex.alias) {
      setResolveAliases(config, pkg.rex.alias);
    }
  });
}

function setResolveAliases(config, aliases) {
  for (var name in aliases) {
    set(config, 'resolve.alias.' + name, aliases[name]);
  }
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

function addEntry(config, entry) {
  if (!hasEntry(config, entry)) {
    unshift(config, 'entry', entry);
  }
}

function hasEntry(config, entry) {
  return config.entry && config.entry.indexOf(entry) !== -1;
}

function unique(array) {
  var nextArray = [];
  for (var i = 0; i < array.length; i++) {
    if (nextArray.indexOf(array[i]) === -1) {
      nextArray.push(array[i]);
    }
  }
  return nextArray;
}

function concat(arrays) {
  return arrays.reduce(function(acc, array) {
    return acc.concat(array);
  }, []);
}

module.exports = {
  configureWebpack: configureWebpack,
  packagePath: packagePath
};
