/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var DataSpecification = require('rex-widget/lib/DataSpecification');

class ContextBinding extends DataSpecification.Binding {

  constructor(keys, options) {
    super(options);
    this.keys = keys;
  }

  bindToContext(context, key) {
    var bind = {};
    var value = this.keys.map(key => context.props.context[key]);
    bind[key] = new DataSpecification.Value(value, this.options);
    return bind;
  }
}

module.exports = {ContextBinding};
