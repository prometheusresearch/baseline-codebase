/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var ConfigurableField = require('./ConfigurableField');

function renderFormItem(formValue, item, props, syntheticKey) {
  if (item.type && item.props) {
    return React.cloneElement(item, {formValue, fieldProps: props, key: syntheticKey});
  } else {
    return (
      <ConfigurableField
        {...props}
        key={item.valueKey}
        formValue={formValue.select(item.valueKey)}
        field={item}
        />
    );
  }
}

module.exports = renderFormItem;
