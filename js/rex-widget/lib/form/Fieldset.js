/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {Fieldset as FieldsetBase} from 'react-forms';
import {VBox} from '@prometheusresearch/react-ui';
import {FieldsetHeader} from './ui';

export default function Fieldset({label, hint, schema, ...props}) {
  return (
    <VBox>
      <FieldsetHeader
        label={label}
        hint={hint}
        isRequired={schema && schema.isRequired}
      />
      <FieldsetBase {...props} schema={schema} />
    </VBox>
  );
}
