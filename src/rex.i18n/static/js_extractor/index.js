/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

'use strict';

process.env['BABEL_ENV'] = 'development';

var babel = require('babel-core');
var fs = require('fs');
var path = require('path');


var allowedExtensions = [
  '.js',
  '.jsx'
];

var excludedDirectories = [
  'node_modules',
  'vendor',
  'test',
  'tests',
  '__tests__',
  'flow-typed',
  'build'
];

var sourceDirectory = process.argv[2];

var outputFile = process.argv[3];

var projectId = process.argv[4];

var babelOptions = {
  presets: [
    'prometheusresearch'
  ],
  plugins: [
    'transform-flow-strip-types',
    [__dirname + '/babel-gettext-extractor.js', {
      fileName: outputFile,
      baseDirectory: sourceDirectory,
      functionNames: {
        gettext: ['msgid'],
        ngettext: ['msgid', 'msgid_plural', 'count'],
        _: ['msgid']
      },
      headers: {
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Transfer-Encoding': '8bit',
        'Project-Id-Version': projectId,
        'POT-Creation-Date': (new Date()).toISOString().substring(0, 16).replace('T', ' ')
      }
    }]
  ]
};


function scanDirectory(dir) {
  if (!fs.existsSync(dir)) { return; }
  fs.readdirSync(dir).forEach((file) => {
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);
    if (stat.isDirectory() && (excludedDirectories.indexOf(file) === -1)) {
      scanDirectory(filePath);
    } else if (allowedExtensions.indexOf(path.extname(file)) > -1) {
      console.log('extracting messages from ' + filePath);
      babel.transformFileSync(filePath, babelOptions);
    }
  });
}

scanDirectory(sourceDirectory);
console.log('writing PO template file to ' + outputFile);

