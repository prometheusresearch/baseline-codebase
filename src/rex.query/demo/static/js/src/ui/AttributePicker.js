/**
 * @flow
 */

import 'react-select/dist/react-select.css';

import type {Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import Select from 'react-select';
import {VBox} from '@prometheusresearch/react-box';

import * as t from '../model/Type';

type AttributePickerProps = {
  pointer: QueryPointer<>;
  path: string;
  onSelect: (selected: ?{path: string}) => *;
};

type Option = {
  value: string;
  label: string;
};

export default class AttributePicker extends React.Component<*, AttributePickerProps, *> {

  onChange = (value: ?Option) => {
    this.props.onSelect(value ? {path: value.value} : null);
  };

  render() {
    let {path, pointer: {query: {context}}} = this.props;
    let options = optionListForContext(context);

    return (
      <VBox>
        <Select
          value={path}
          options={options}
          onChange={this.onChange}
          />
      </VBox>
    );
  }
}

function optionListForContext(context: Context): Array<Option> {
  let options = [];

  // Collect paths from an input type
  if (context.inputType != null) {
    let type = t.atom(context.inputType);
    if (type.name === 'entity') {
      let attribute = context.domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          options.push({value: k, label: k});
        }
      }
    }
  }

  // Collect paths from scope
  for (let k in context.scope) {
    if (context.scope.hasOwnProperty(k)) {
      options.push({value: k, label: k});
    }
  }

  return options;
}
