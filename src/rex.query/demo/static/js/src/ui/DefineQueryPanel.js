/**
 * @flow
 */

import type {DefineQuery} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as ReactBox from '@prometheusresearch/react-box';

import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';

type DefineQueryPanelProps = {
  pointer: QueryPointer<DefineQuery>;
  onClose: () => *;
};

export default class DefineQueryPanel extends React.Component<*, DefineQueryPanelProps, *> {

  context: {actions: QueryBuilderActions};

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {onClose, pointer} = this.props;
    return (
      <QueryPanelBase
        title="Define"
        onClose={onClose}
        theme={theme.traverse}
        pointer={pointer}>
        <ReactBox.VBox padding={5}>
          <ReactUI.Input
            value={pointer.query.binding.name}
            onChange={this.onBindingName}
            />
        </ReactBox.VBox>
      </QueryPanelBase>
    );
  }

  onBindingName = (e: Event) => {
    let target: {value: string} = (e.target: any);
    let name = target.value;
    this.context.actions.renameDefineBinding(this.props.pointer, name);
  };
}
