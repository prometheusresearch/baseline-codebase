/**
 * @flow
 */

import type {Query, QueryPipeline, Domain} from './model';

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

import * as qp from './model/QueryPointer';
import * as ui from './ui';
import * as State from './state';

type QueryBuilderProps = {
  domain: Domain;
  api: string;
  initialQuery: ?QueryPipeline;
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
          if (this.props.onQuery) {
            this.props.onQuery(state.query);
          }
        });
      }
    );

    this.state = this.container.getState();
    this.actions = this.container.actions;
  }

  render() {
    let {
      query,
      selected,
      queryInvalid,
      data,
      showPanel,
      showConsole,
      focusedSeq,
    } = this.state;

    let pointer = qp.make(query);

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
              onClick={this.actions.onConsoleToggle}
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
          <LeftPanelWrapper>
            <ui.QueryVis
              domain={this.props.domain}
              pointer={pointer}
              selected={selected}
              showPanel={showPanel}
              onShowSelect={this.actions.showSelect}
              />
          </LeftPanelWrapper>
          {showPanel && selected &&
            <CenterPanelWrapper>
              <ui.QueryPanel
                onClose={this.actions.hidePanel}
                pointer={selected}
                />
            </CenterPanelWrapper>}
          <RightPanelWrapper>
            {query && data != null && !queryInvalid
              ? <ui.DataTable
                  query={query}
                  data={data}
                  focusedSeq={focusedSeq}
                  onFocusedSeq={this.onFocusedSeq}
                  />
              : queryInvalid
              ? <InvalidQueryMessage onUndo={this.actions.undo} />
              : null}
          </RightPanelWrapper>
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

  onConsoleToggle = () => {
    if (this.state.showConsole) {
      this.actions.hideConsole();
    } else {
      this.actions.showConsole();
    }
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

let CenterPanelWrapper = style(VBox, {
  base: {
    flexBasis: '200px',
    flexGrow: 1,
    height: '100%',
    overflow: 'auto',
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let RightPanelWrapper = style(VBox, {
  base: {
    flexBasis: '400px',
    flexGrow: 3,
    borderLeft: css.border(1, '#ccc'),
  }
});

let LeftPanelWrapper = style(VBox, {
  base: {
    flexBasis: '300px',
    overflow: 'auto',
    height: '100%',
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});
