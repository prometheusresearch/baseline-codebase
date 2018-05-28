/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React        from 'react';
import Field        from './Field';
import IntegerInput from './IntegerInput';

export default function IntegerField(props) {
  return (
    <Field {...props}>
      <IntegerInput />
    </Field>
  );
}
