'use strict';

function IntrospectablePlugin(options) {
  options = options || {};
  this.requireName = options.requireName || '__require__';
}

var POSSIBLE_ERRORS = [
  '',
  '',
  'Things to look into:',
  '  - Check that the module exists',
  '  - Check that the package or the package the module'
].join('\n');

IntrospectablePlugin.prototype.apply = function(compiler) {
  // Mapping CommonJS module reference to module id
  var registry = {};

  // Mapping resource to CommonJS module reference
  // This is filled by introspection/loader.
  var introspectables = compiler.__introspectables = {};

  compiler.plugin('compilation', function(compilation) {

    compilation.plugin('after-optimize-module-ids', function(modules) {
      modules.forEach(function(module) {
        if (introspectables[module.resource]) {
          registry[introspectables[module.resource]] = module.id;
        }
      }.bind(this));
    }.bind(this));

    compilation.mainTemplate.plugin('startup', function(source) {
      if (Object.keys(registry).length > 0) {
        return [
          'if (typeof window !== "undefined") {',
          '  var __introspectable_modules__ = ' + JSON.stringify(registry) + ';',
          '  window.' + this.requireName + ' = function(id) {',
          '    var module = __introspectable_modules__[id];',
          '    if (module === undefined) {',
          '      throw new Error([',
          '        "Cannot find module " + id + " in the application bundle.",',
          '        "",',
          '        "Things to look into:",',
          '        "  - Check that the module exists",',
          '        "  - Check that the package this module in has \\"rex\\": {\\"bundleAll\\": true} in its bower.json metadata",',
          '      ].join("\\n"));',
          '    }',
          '    return __webpack_require__(module);',
          '  };',
          '  window.' + this.requireName + '.__introspectable_modules__ = __introspectable_modules__;',
          '}'
        ].join('\n') + source;
      } else {
        return source;
      }
    }.bind(this));

  }.bind(this));
}

module.exports = IntrospectablePlugin;
