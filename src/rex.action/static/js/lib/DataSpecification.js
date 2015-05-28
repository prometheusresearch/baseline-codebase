/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var DataSpecification = require('rex-widget/lib/DataSpecification');

class ContextBinding extends DataSpecification.Binding {

  constructor(keys, isJoin, options) {
    super(options);
    this.keys = keys;
    this.isJoin = isJoin;
  }

  bindToContext(context, key) {
    var bind = {};
    var value = this.keys.map(key => context.props.context[key]);
    if (this.isJoin) {
      value = value.join('.');
    }
    bind[key] = new DataSpecification.Value(value, this.options);
    return bind;
  }
}

module.exports = {ContextBinding};
