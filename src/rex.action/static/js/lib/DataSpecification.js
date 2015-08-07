/**
 * @copyright 2015, Prometheus Research, LLC
 */

import DataSpecification from 'rex-widget/lib/DataSpecification';

export class ContextBinding extends DataSpecification.Binding {

  constructor(keys, isJoin, options) {
    super(options);
    this.keys = keys;
    this.isJoin = isJoin;
  }

  bindToContext(context, key) {
    var bind = {};
    var value = this.keys.map(key => {
      let value = context.props.context[key];
      if (typeof value === 'object' && value['meta:type']) {
        value = value.id;
      }
      return value;
    });
    if (this.isJoin) {
      value = value.join('.');
    }
    bind[key] = new DataSpecification.Value(value, this.options);
    return bind;
  }
}
