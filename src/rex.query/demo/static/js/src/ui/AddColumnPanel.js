/**
 * @flow
 */

import type {Query, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';

import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import ColumnPicker from './ColumnPicker';
import * as FieldList from '../state/FieldList';

type AddColumnPanelProps = {
  pointer: QueryPointer<Query>;
  onClose: () => *;
  fieldList: FieldList.FieldList;
};

export default class AddColumnPanel extends React.Component<*, AddColumnPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onSelect = (fieldPath: FieldList.FieldPath) => {
    if (FieldList.contains(this.props.fieldList, fieldPath)) {
      this.context.actions.removeFromFieldList({fieldPath});
    } else {
      this.context.actions.addToFieldList({fieldPath});
    }
  };

  render() {
    let {pointer, fieldList, ...props} = this.props;
    return (
      <QueryPanelBase
        {...props}
        theme={theme.select}
        title="Explore">
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
