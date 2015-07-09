'use strict';

var fs                   = require('fs');
var path                 = require('path');
var webpack              = require('webpack');
var ExtractTextPlugin    = require('extract-text-webpack-plugin');
var IntrospectablePlugin = require('rex-setup/introspection/plugin');
var PackageLoadersPlugin = require('webpack-package-loaders-plugin');

var introspectionLoader  = require.resolve('./introspection/loader');

var DEV           = !!process.env.REX_SETUP_DEV;
var BUNDLE_PREFIX = process.env.REX_SETUP_BUNDLE_PREFIX || '/bundle/';

var cwd = process.cwd();
var packageDirectory = path.join(cwd, 'node_modules');

function getPackageMetadata(directory) {
  var packageMetadataFilename = path.join(directory, 'package.json');
  if (!fs.existsSync(packageMetadataFilename)) {
    return null;
  }
  var src = fs.readFileSync(packageMetadataFilename, 'utf8');
  return JSON.parse(src);
}

function getListOfDependencies(packageMetadata, seen) {
  seen = seen || {};
  var mask = packageMetadata && packageMetadata.rex && packageMetadata.rex.dependencies || null;
  var dependencies = fs.readdirSync(packageDirectory)
    .map(function(dir) { return path.join(packageDirectory, dir); })
    .map(getPackageMetadata)
    .filter(Boolean)
    .filter(function(pkg) { return !seen[pkg.name] && !!pkg.rex; });
  if (mask) {
    dependencies = dependencies.filter(function(pkg) {
      return mask[pkg.name] !== false;
    });
  }
  dependencies.forEach(function(pkg) {
    seen[pkg.name] = pkg;
  });
  return unique(dependencies.concat(concat(dependencies.map(function(pkg) { return getListOfDependencies(pkg, seen); }))));
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
  config = config || {};
  var pkg = getPackageMetadata(cwd);
  var deps = getListOfDependencies(pkg);

  // add style entry either via rex.style key in package metadata or implicitly
  if (pkg && pkg.rex && pkg.rex.style) {
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
    addEntry(config, 'rex-setup/introspection/loader?all!./');
  } else {
    addEntry(config, './');
  }

  addEntry(config, require.resolve('core-js/modules/es6.object.assign'));
  addEntry(config, require.resolve('core-js/modules/es6.promise'));

  set(config, 'watchOptions.aggregateTimeout', 200);

  setResolveAliasesFromPackages(config, [pkg].concat(deps));

  set(config, 'output.path', process.cwd());
  set(config, 'output.filename', 'bundle.js');
  unshift(config, 'module.loaders', [
    {
      test: /\.less$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader?-minimize!less-loader')
    },
    {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader?-minimize')
    },
    { test: /\.png$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.jpg$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.gif$/, loader: 'url-loader?prefix=img/&limit=5000' },
		{ test: /\.eot(\?[a-z0-9]+)?$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.ttf(\?[a-z0-9]+)?$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.svg(\?[a-z0-9]+)?$/, loader: 'file-loader?prefix=font/' },
		{ test: /\.woff(\?[a-z0-9]+)?$/, loader: 'url-loader?prefix=font/&limit=5000' },
		{ test: /\.woff2(\?[a-z0-9]+)?$/, loader: 'url-loader?prefix=font/&limit=5000' }
  ]);

  unshift(config, 'resolveLoader.root', process.env.NODE_PATH);
  unshift(config, 'resolveLoader.root', path.join(process.cwd(), 'node_modules'));

  unshift(config, 'resolve.fallback', packageDirectory);
  unshift(config, 'resolve.extensions', ['', '.js']);

  unshift(config, 'plugins' ,[
    new DeactivateResultSymlinkPlugin(),
    new PackageLoadersPlugin({
      packageMeta: ['package.json'],
      loadersKeyPath: ['rex', 'loaders'],
      injectLoaders: injectDefaultLoaders
    }),
    new ExtractTextPlugin('bundle.css'),
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

function DeactivateResultSymlinkPlugin() {
}

DeactivateResultSymlinkPlugin.prototype.apply = function(compiler) {
  var apply = compiler.resolvers.normal.apply.bind(compiler.resolvers.normal);
  compiler.resolvers.normal.apply = function() {
    var plugins = [];
    for (var i = 0; i < arguments.length; i++) {
      var plugin = arguments[i];
      if (plugin && plugin.constructor && plugin.constructor.name === 'ResultSymlinkPlugin') {
        continue;
      }
      plugins.push(plugin);
    }
    return apply.apply(null, plugins);
  };
}

function injectDefaultLoaders(packageMeta, packageDirname, filename) {
  if (packageMeta.rex !== undefined && packageMeta.rex.loaders === undefined) {
    return [
      {
        test: /\.js$/,
        loader: 'babel-loader?stage=0'
      }
    ];
  } else {
    return [];
  }
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
