'use strict';

var fs              = require('fs');
var path            = require('path');
var qs              = require('querystring');
var readdir         = require('recursive-readdir');

function readMetadata(fs, directory, filename, cb) {
  filename = path.join(directory, filename);
  fs.stat(filename, function(err, stat) {
    if (!err && stat) {
      fs.readFile(filename, function(err, contents) {
        if (err) {
          cb(err);
        } else {
          try {
            var metadata = JSON.parse(contents.toString());
            cb(null, metadata);
          } catch (innerErr) {
            cb(innerErr);
          }
        }
      });
    } else if (err && err.code === 'ENOENT') {
      cb(null, null);
    } else {
      cb(err);
    }
  });
}

function findPackageMetadata(fs, directory, cb) {
  readMetadata(fs, directory, 'bower.json', function(err, metadata) {
    if (err) {
      cb(err);
    } else if (metadata === null) {
      readMetadata(fs, directory, 'package.json', function(err, metadata) {
        if (err) {
          cb(err);
        } else if (metadata === null) {
          var nextDirectory = path.join(directory, '..');
          if (nextDirectory === directory) {
            cb(null, null, null);
          } else {
            findPackageMetadata(fs, nextDirectory, cb);
          }
        } else {
          cb(null, metadata, directory);
        }
      });
    } else {
      cb(null, metadata, directory);
    }
  });
}

module.exports = function introspectionLoader(source) {
  this.cacheable();

  var cb = this.async();
  var fs = this._compiler.inputFileSystem;
  var query = qs.parse(this.query.slice(1));

  if (!this._compiler.__introspectables) {
    return cb(new Error(
      'loader "introspection/loader" should only be '
      + 'used if "introspection/plugin" is used'
    ));
  }

  var introspectables = this._compiler.__introspectables;

  findPackageMetadata(fs, this.context, function(err, metadata, packageDirectory) {
    if (err) {
      cb(err);
    } else if (metadata === null) {
      cb(new Error(
        'loader "introspection/loader" was unable to find package metadata for '
        + '"' + this.resourcePath + '" module'
      ));
    } else {

      if (metadata.main && path.join(packageDirectory, metadata.main) === this.resourcePath) {
        introspectables[this.resourcePath] = metadata.name;
      } else {
        introspectables[this.resourcePath] = metadata.name + '/' + path.relative(packageDirectory, this.resourcePath);
      }

      if (query.all !== undefined) {
        var dirname = path.dirname(this.resourcePath);
        // XXX: doesn't use cached filesystem instance :(
        readdir(dirname, function(err, files) {
          if (err) {
            cb(err);
          } else {
            var deps = ';';
            files.forEach(function(file) {
              if (file === this.resourcePath) {
                return;
              }

              var name = (
                metadata.name
                + '/'
                + path.relative(packageDirectory, file)
              ).replace(/\.js$/, '');
              deps += 'require("./' + path.relative(this.context, file) + '");'
              if (!introspectables[file]) {
                introspectables[file] = name;
              }
            }.bind(this));
            cb(null, source + deps);
          }
        }.bind(this));
      } else {
        cb(null, source);
      }
    }
  }.bind(this));
}
