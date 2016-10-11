/**
 * @flow
 */

import type {Query, QueryPointer} from '../model';
import type {Actions} from '../state';

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

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onSelect = (field: string) => {
    let fieldList = this.props.fieldList.slice(0);
    let idx = fieldList.indexOf(field);
    if (idx === -1) {
      this.context.actions.addToFieldList({field});
    } else {
      this.context.actions.removeFromFieldList({field});
    }
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
