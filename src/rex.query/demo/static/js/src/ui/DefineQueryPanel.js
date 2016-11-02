/**
 * @flow
 */

import type {DefineQuery} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as ReactBox from '@prometheusresearch/react-box';

import * as t from '../model/Type';
import * as qp from '../model/QueryPointer';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuTitle, MenuHelp} from './menu';
import ColumnPicker from './ColumnPicker';

type DefineQueryPanelProps = {
  pointer: QueryPointer<DefineQuery>;
  onClose: () => *;
};

export default class DefineQueryPanel
  extends React.Component<*, DefineQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {onClose, pointer} = this.props;
    let type = t.maybeAtom(pointer.query.binding.query.context.type);
    let hasConfigurableColumns = (
      type &&
      (type.name === 'record' ||
       type.name === 'entity')
    );
    let last = qp.select(
      pointer,
      ['binding', 'query'],
      ['pipeline', pointer.query.binding.query.pipeline.length - 1]
    );
    return (
      <QueryPanelBase
        title={pointer.query.binding.name}
        onClose={onClose}
        theme={theme.def}
        pointer={pointer}>
        {false && <MenuTitle size="large">
          Rename query
        </MenuTitle>}
        {false && <ReactBox.VBox padding={10} marginBottom={10}>
          <ReactUI.Input
            disabled
            style={{color: '#888'}}
            value={pointer.query.binding.name}
            onChange={this.onBindingName}
            />
          <MenuHelp>
            This piece of functionality isn't implemented yet. Check back soon!
          </MenuHelp>
        </ReactBox.VBox>}
        <MenuTitle size="large">
          Configure columns
        </MenuTitle>
        {hasConfigurableColumns ?
          <ColumnPicker
            showSelectMenu
            onSelect={this.onSelect}
            onSelectRemove={this.onSelectRemove}
            pointer={last}
            /> :
          <MenuHelp>
            This query has no columns to configure.
          </MenuHelp>}
      </QueryPanelBase>
    );
  }

  onSelect = (payload: {path: string}) => {
    let {path} = payload;
    let {pointer} = this.props;
    // FIXME: cleanup this mess
    this.context.actions.navigate({
      pointer: qp.select(pointer, ['binding', 'query']),
      path: [path]
    });
  };

  onSelectRemove = (payload: {path: string; pointer: QueryPointer<>}) => {
    let {pointer} = payload;
    this.context.actions.cut(pointer);
  };

  onBindingName = (e: Event) => {
    let target: {value: string} = (e.target: any);
    let name = target.value;
    this.context.actions.renameDefineBinding({pointer: this.props.pointer, name});
  };
}
