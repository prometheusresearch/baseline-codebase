/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import NumberInput from './NumberInput';
import Field from './Field';

export default function NumberField(props) {
  return (
    <Field {...props}>
      <NumberInput />
    </Field>
  );
}
