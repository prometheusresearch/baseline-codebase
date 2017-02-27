/**
 * @flow
 */

import type {QueryPipeline, DefineQuery} from '../model';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from 'react-stylesheet';

import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuTitle, MenuGroup, MenuButton, MenuHelp} from './menu';
import ColumnPicker from './ColumnPicker';
import * as Icon from './Icon';

type DefineQueryPanelProps = {
  query: DefineQuery,
  onClose: () => *,
  onSearch: SearchCallback,
};

export default class DefineQueryPanel
  extends React.Component<*, DefineQueryPanelProps, *> {
  context: {
    actions: Actions,
  };

  state: {
    renameOpen: boolean,
    renameValue: ?string,
  } = {
    renameOpen: false,
    renameValue: null,
  };

  bindingRenameInput: ?HTMLElement = null;

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {
      onClose,
      onSearch,
      query,
    } = this.props;
    let {
      renameOpen,
      renameValue,
    } = this.state;

    let type = query.binding.query.context.type;

    let hasConfigurableColumns = type && type.name === 'record';

    return (
      <QueryPanelBase
        title="Configure columns"
        onClose={onClose}
        theme={theme.def}
        query={query}>
        <VBox marginBottom={10}>
          {!renameOpen
            ? false &&
                <MenuGroup>
                  <MenuButton
                    icon={<Icon.IconPencil />}
                    onClick={this.onBindingRenameBegin}>
                    Rename query
                  </MenuButton>
                </MenuGroup>
            : <VBox>
                <MenuTitle size="large">
                  Rename query
                </MenuTitle>
                <VBox padding={10}>
                  <ReactUI.Input
                    ref={this.onBindingRenameInputRef}
                    value={renameValue || ''}
                    onKeyDown={this.onBindingRenameKey}
                    onChange={this.onBindingRenameChange}
                  />
                  <HBox padding={5}>
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
                  </HBox>
                </VBox>
              </VBox>}
        </VBox>
        {hasConfigurableColumns
          ? <ColumnPicker
              onSelect={this.onSelect}
              onSelectRemove={this.onSelectRemove}
              onSearch={onSearch}
              query={query.binding.query}
            />
          : <MenuHelp>
              This query has no columns to configure.
            </MenuHelp>}
      </QueryPanelBase>
    );
  }

  onSelect = (payload: {path: string}) => {
    let {path} = payload;
    let {query} = this.props;
    this.context.actions.navigate({
      at: query.binding.query,
      path: [path],
    });
  };

  onSelectRemove = (payload: {path: string, query: QueryPipeline}) => {
    let {query} = payload;
    this.context.actions.cut({at: query});
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
      renameValue: this.props.query.binding.name,
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
    this.setState(
      state => ({
        ...state,
        renameOpen: false,
        renameValue: null,
      }),
      () => {
        if (renameValue != null) {
          this.context.actions.renameDefineBinding({
            at: this.props.query,
            name: renameValue,
          });
        }
      },
    );
  };

  onBindingRenameCancel = () => {
    this.setState(state => ({
      ...state,
      renameOpen: false,
      renameValue: null,
    }));
  };
}
