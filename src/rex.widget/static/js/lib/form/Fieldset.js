/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {Fieldset as FieldsetBase} from 'react-forms';
import {VBox} from '../../layout';
import {style} from '../../stylesheet';

let Label = style('label', {
  color: '#666',
  fontSize: '90%',
  fontWeight: 700,
  margin: 0,
  marginBottom: 15,
});

export default function Fieldset({label, ...props}) {
  return (
    <VBox>
      {label && <Label>{label}</Label>}
      <FieldsetBase {...props} />
    </VBox>
  );
}
