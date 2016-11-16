/**
 * @flow
 */

import type {DefineQuery} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as ReactBox from '@prometheusresearch/react-box';

import * as qp from '../model/QueryPointer';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuTitle, MenuGroup, MenuButton, MenuHelp} from './menu';
import ColumnPicker from './ColumnPicker';
import PencilIcon from './PencilIcon';

type DefineQueryPanelProps = {
  pointer: QueryPointer<DefineQuery>;
  onClose: () => *;
};

export default class DefineQueryPanel
  extends React.Component<*, DefineQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  state: {
    renameOpen: boolean;
    renameValue: ?string;
  } = {
    renameOpen: false,
    renameValue: null,
  };

  bindingRenameInput: ?HTMLElement = null;

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {
      onClose,
      pointer
    } = this.props;
    let {
      renameOpen,
      renameValue,
    } = this.state;

    let type = pointer.query.binding.query.context.type;

    let hasConfigurableColumns = (
      type &&
      type.name === 'record'
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
        <ReactBox.VBox marginBottom={10}>
          {!renameOpen ?
            <MenuGroup>
              <MenuButton
                icon={<PencilIcon />}
                onClick={this.onBindingRenameBegin}>
                Rename query
              </MenuButton>
            </MenuGroup> :
            <ReactBox.VBox>
              <MenuTitle size="large">
                Rename query
              </MenuTitle>
              <ReactBox.VBox padding={10}>
                <ReactUI.Input
                  ref={this.onBindingRenameInputRef}
                  value={renameValue || ''}
                  onKeyDown={this.onBindingRenameKey}
                  onChange={this.onBindingRenameChange}
                  />
                <ReactBox.HBox padding={5}>
                  <ReactUI.FlatSuccessButton
                    onClick={this.onBindingRenameCommit}
                    size="small"
                    groupHorizontally>
                    Save
                  </ReactUI.FlatSuccessButton>
                  <ReactUI.FlatButton
                    onClick={this.onBindingRenameCancel}
                    size="small"
                    groupHorizontally>
                    Cancel
                  </ReactUI.FlatButton>
                </ReactBox.HBox>
              </ReactBox.VBox>
            </ReactBox.VBox>}
        </ReactBox.VBox>
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

  onBindingRenameInputRef = (bindingRenameInput: any) => {
    this.bindingRenameInput = bindingRenameInput
      ? ReactDOM.findDOMNode(bindingRenameInput)
      : null;
    if (this.bindingRenameInput) {
      this.bindingRenameInput.focus();
    }
  };

  onBindingRenameBegin = () => {
    this.setState(state => ({
      ...state,
      renameOpen: true,
      renameValue: this.props.pointer.query.binding.name,
    }));
  };

  onBindingRenameChange = (e: Event) => {
    let target: {value: string} = (e.target: any);
    let renameValue = target.value;
    this.setState(state => ({...state, renameValue}));
  };

  onBindingRenameKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.onBindingRenameCommit();
    } else if (e.key === 'Escape') {
      this.onBindingRenameCancel();
    }
  };

  onBindingRenameCommit = () => {
    const {renameValue} = this.state;
    this.setState(state => ({
      ...state,
      renameOpen: false,
      renameValue: null
    }), () => {
      if (renameValue != null) {
        this.context.actions.renameDefineBinding({
          pointer: this.props.pointer,
          name: renameValue
        });
      }
    });
  };

  onBindingRenameCancel = () => {
    this.setState(state => ({
      ...state,
      renameOpen: false,
      renameValue: null
    }));
  };
}
