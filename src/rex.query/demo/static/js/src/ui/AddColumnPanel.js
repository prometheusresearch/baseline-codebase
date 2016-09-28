/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

import * as theme from './Theme';
import * as t from '../model/Type';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onClose: () => *;
  fieldList: Array<string>;
  onFieldList: (data: {fieldList: Array<string>, close: boolean}) => *;
};

export default class AddColumnPanel extends React.Component<*, AddColumnPanelProps, *> {

  onSelect = (field: string) => {
    let fieldList = this.props.fieldList.slice(0);
    let idx = fieldList.indexOf(field);
    if (idx === -1) {
      fieldList.push(field);
    } else {
      fieldList.splice(idx, 1);
    }
    this.props.onFieldList({fieldList, close: false});
  };

  render() {
    let {pointer, fieldList, ...props} = this.props;
    let columns = getColumnList(pointer.query.context);
    return (
      <QueryPanelBase
        {...props}
        theme={theme.select}
        title="Configure columns">
        {columns.length > 0 ?
          <ColumnPicker
            selected={fieldList}
            options={columns}
            onSelect={this.onSelect}
            /> :
          <NoColumnsMessage />}
      </QueryPanelBase>
    );
  }
}

let NoColumnsMessageRoot = style(VBox, {
  displayName: 'NoColumnsMessageRoot',
  base: {
    fontWeight: 200,
    fontSize: '10pt',
    color: '#aaa',
  }
});

function NoColumnsMessage() {
  return (
    <NoColumnsMessageRoot grow={1} justifyContent="center" alignItems="center">
      <VBox width="80%" style={{textAlign: 'center'}}>
        No columns are available to select from.
      </VBox>
    </NoColumnsMessageRoot>
  );
}

function getColumnList(context) {
  let options = [];

  // Collect paths from an input type
  if (context.type != null) {
    let type = t.atom(context.type);
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
