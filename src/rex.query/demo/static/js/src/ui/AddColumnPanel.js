/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';

import * as theme from './Theme';
import * as t from '../model/Type';
import * as q from '../model/Query';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';
import Message from './Message';

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
    let options = q.getNavigationAfter(pointer.query.context);
    return (
      <QueryPanelBase
        {...props}
        theme={theme.select}
        title="Configure columns">
        {options.length > 0 ?
          <ColumnPicker
            selected={fieldList}
            options={options}
            onSelect={this.onSelect}
            pointer={pointer}
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
    <Message>
      No columns are available to select from.
    </Message>
  );
}
