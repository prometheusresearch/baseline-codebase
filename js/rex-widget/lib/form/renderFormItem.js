/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React              from 'react';
import ConfigurableField  from './ConfigurableField';
import isReactElement     from '../isReactElement';

export default function renderFormItem(formValue, item, props, syntheticKey) {
  if (isReactElement(item)) {
    return React.cloneElement(item, {
      formValue,
      fieldProps: props,
      key: syntheticKey
    });
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
