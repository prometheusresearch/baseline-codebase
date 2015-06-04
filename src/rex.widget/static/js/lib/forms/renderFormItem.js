/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var ConfigurableField = require('./ConfigurableField');
var {cloneWithProps}  = React.addons;

function renderFormItem(formValue, item, props, syntheticKey) {
  if (item.type && item.props) {
    return cloneWithProps(item, {formValue, fieldProps: props, key: syntheticKey});
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
