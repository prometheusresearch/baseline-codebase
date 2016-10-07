/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';

import * as theme from './Theme';
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
    return (
      <QueryPanelBase
        {...props}
        theme={theme.select}
        title="Configure columns">
        <ColumnPicker
          allowNested
          selected={fieldList}
          onSelect={this.onSelect}
          pointer={pointer}
          />
      </QueryPanelBase>
    );
  }
}
