/**
 * @flow
 */

import type {Query, Domain, DomainEntity, DefineQuery} from './model';

import invariant from 'invariant';
import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import ArrowLeftIcon  from 'react-icons/lib/fa/arrow-left';
import ArrowRightIcon  from 'react-icons/lib/fa/arrow-right';
import DownloadIcon from 'react-icons/lib/fa/cloud-download';
import TerminalIcon from 'react-icons/lib/fa/terminal';
import CogIcon from 'react-icons/lib/fa/cog';

import * as qp from './model/QueryPointer';
import * as ui from './ui';
import * as State from './state';
import * as FieldList from './state/FieldList';

type QueryBuilderProps = {
  domain: Domain;
  api: string;
  initialQuery: ?Query;
  onQuery: (query?: ?Query) => *;
};

export default class QueryBuilder extends React.Component {

  state: State.State;
  props: QueryBuilderProps;
  actions: State.Actions;
  container: State.StateContainer;

  static defaultProps = {
    onQuery: (query?: ?Query) => {},
  };

  static childContextTypes = {
    actions: React.PropTypes.object,
  };

  constructor(props: QueryBuilderProps) {
    super(props);

    let {domain, initialQuery, api} = props;

    this.container = State.createContainer(
      {domain, api, initialQuery},
      (state, onStateUpdated) => {
        this.setState(state, () => {
          invariant(this.state != null, 'State is not ready');
          onStateUpdated(this.state);
          this.props.onQuery(state.query);
        });
      }
    );

    this.state = this.container.getState();
    this.actions = this.container.actions;
  }

  render() {
    let {
      query,
      queryInvalid,
      fieldList,
      selected,
      data,
      showAddColumnPanel,
      showConsole,
      focusedSeq,
    } = this.state;

    let pointer = query != null ? qp.make(query) : null;

    return (
      <VBox height="100%">
        <QueryBuilderToolbar width="100%" padding={5} height={35}>
          <ReactUI.QuietButton
            disabled={this.state.undoStack.length < 1}
            onClick={this.container.actions.undo}
            icon={<ArrowLeftIcon />}
            size="small"
            groupHorizontally>
            Undo
          </ReactUI.QuietButton>
          <ReactUI.QuietButton
            disabled={this.state.redoStack.length < 1}
            onClick={this.actions.redo}
            iconAlt={<ArrowRightIcon />}
            size="small"
            groupHorizontally>
            Redo
          </ReactUI.QuietButton>
          <HBox marginLeft="auto">
            <ReactUI.QuietButton
              onClick={this.actions.toggleConsole}
              active={showConsole}
              icon={<TerminalIcon />}
              size="small">
              Console
            </ReactUI.QuietButton>
            <ReactUI.QuietButton
              onClick={this.actions.export}
              icon={<DownloadIcon />}
              size="small">
              Export as .csv
            </ReactUI.QuietButton>
          </HBox>
        </QueryBuilderToolbar>
        {showConsole &&
          <Console basis="200px">
            <ConsoleInput onChange={this.onConsoleChange} />
          </Console>}
        <HBox grow={1} height="calc(100% - 35px)">
          <VBox
            basis="300px"
            overflow="auto"
            height="100%"
            overflow="auto"
            style={{boxShadow: css.boxShadow(0, 0, 3, 0, '#666')}}>
            <ui.QueryVis
              domain={this.props.domain}
              pointer={pointer}
              selected={selected}
              showAddColumnPanel={showAddColumnPanel}
              onAddColumn={this.actions.showAddColumnPanel}
              />
          </VBox>
          {(pointer && (selected || showAddColumnPanel)) &&
            <VBox
              basis="200px"
              grow={1}
              height="100%"
              overflow="auto"
              style={{boxShadow: css.boxShadow(0, 0, 3, 0, '#666')}}>
              {showAddColumnPanel ?
                <ui.AddColumnPanel
                  fieldList={fieldList}
                  onFieldList={this.actions.updateFieldList}
                  pointer={pointer}
                  onClose={this.actions.hideAddColumnPanel}
                  /> :
                <ui.QueryPanel
                  onClose={this.actions.select.bind(null, null)}
                  pointer={selected}
                  />}
            </VBox>}
          <VBox basis="400px" grow={3} style={{borderLeft: css.border(1, '#ccc')}}>
            {query && data != null && !queryInvalid
              ? fieldList.length === 0
                ? <NoColumnsMessage
                    showAddColumnPanel={showAddColumnPanel}
                    onAddColumn={this.actions.showAddColumnPanel}
                    />
                : <ui.DataTable
                    fieldList={fieldList}
                    query={FieldList.addSelect(query, fieldList)}
                    data={data}
                    focusedSeq={focusedSeq}
                    onFocusedSeq={this.onFocusedSeq}
                    />
              : queryInvalid
              ? <InvalidQueryMessage onUndo={this.actions.undo} />
              : null}
          </VBox>
        </HBox>
      </VBox>
    );
  }

  getChildContext() {
    return {actions: this.actions};
  }

  componentDidMount() {
    this.actions.init();
  }

  componentWillUnmount() {
    this.container.dispose();
  }

  onConsoleChange = (e: UIEvent) => {
    let value = ((e.target: any): HTMLInputElement).value;
    this.actions.consoleInput({value});
  };

  onFocusedSeq = (focusedSeq: Array<string>) => {
    this.actions.focusOnSeq({focusedSeq});
  };

}

function InvalidQueryMessage({onUndo}) {
  return (
    <ui.Message>
      Query is invalid. You need to either fix it or
      <ReactUI.Button
        onClick={onUndo}
        style={{verticalAlign: 'middle', margin: 4, marginTop: 2}}
        icon={<ArrowLeftIcon />}
        size="small">
        return back
      </ReactUI.Button>
      to the previous state.
    </ui.Message>
  );
}

function NoColumnsMessage({onAddColumn, showAddColumnPanel}) {
  if (showAddColumnPanel) {
    return (
      <ui.Message>
        No columns configured.
      </ui.Message>
    );
  } else {
    return (
      <ui.Message>
        No columns configured.
        Click
        <ReactUI.FlatButton
          style={{verticalAlign: 'middle', margin: 4, marginTop: 2}}
          icon={<CogIcon />}
          size="small"
          onClick={onAddColumn}>
          Configure columns
        </ReactUI.FlatButton>
        to add a few.
      </ui.Message>
    );
  }
}

let QueryBuilderToolbar = style(HBox, {
  base: {
    zIndex: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let Console = style(VBox, {
  base: {
    zIndex: 1,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let ConsoleInput = style('textarea', {
  base: {
    width: '100%',
    height: '100%',
    padding: 10,
    fontFamily: 'Menlo, monospace',
    border: 'none',
  }
});
