/**
 * @flow
 */

import type {Query, QueryPipeline, Domain} from './model';
import type {SearchCallback} from './ui';

import invariant from 'invariant';
import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {css, style, VBox, HBox} from 'react-stylesheet';

import * as Icon from './ui/Icon';
import * as qp from './model/QueryPointer';
import * as ui from './ui';
import * as State from './state';

type QueryBuilderProps = {
  domain: Domain;
  api: string;
  initialQuery: ?QueryPipeline;
  limitSelectQuery: number;
  onQuery: (query?: ?Query) => *;
  onSearch?: SearchCallback;
  toolbar?: ?React.Element<*>;
};

export default class QueryBuilder extends React.Component {

  state: State.State;
  props: QueryBuilderProps;
  actions: State.Actions;
  container: State.StateContainer;

  static defaultProps = {
    onQuery: (query?: ?Query) => {},
    limitSelectQuery: 10000,
  };

  static childContextTypes = {
    actions: React.PropTypes.object,
  };

  constructor(props: QueryBuilderProps) {
    super(props);

    let {domain, initialQuery, api, limitSelectQuery} = props;

    this.container = State.createContainer(
      {domain, api, initialQuery, translateOptions: {limitSelect: limitSelectQuery}},
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
      domain,
      toolbar,
    } = this.props;
    let {
      query,
      selected,
      insertAfter,
      queryInvalid,
      queryLoading,
      data,
      showPanel,
      focusedSeq,
    } = this.state;

    let disablePanelClose = false;
    let pointer = qp.make(query);

    // FIXME: we should maintain this invariant in the state container
    if (isEmptyQuery(query)) {
      insertAfter = qp.make(query, ['pipeline', 0]);
      disablePanelClose = true;
      showPanel = true;
    }

    return (
      <VBox height="100%">
        <QueryBuilderToolbar width="100%" padding={5} height={35}>
          <ReactUI.QuietButton
            disabled={this.state.undoStack.length < 1}
            onClick={this.container.actions.undo}
            icon={<Icon.IconArrowLeft />}
            size="small"
            groupHorizontally>
            Undo
          </ReactUI.QuietButton>
          <ReactUI.QuietButton
            disabled={this.state.redoStack.length < 1}
            onClick={this.actions.redo}
            iconAlt={<Icon.IconArrowRight />}
            size="small"
            groupHorizontally>
            Redo
          </ReactUI.QuietButton>
          {toolbar &&
            <HBox flexGrow={1} padding={{horizontal: 10}}>
              {toolbar}
            </HBox>}
          <HBox marginLeft="auto">
            <ReactUI.QuietButton
              onClick={this.actions.export}
              icon={<Icon.IconDownload />}
              size="small">
              Export as .csv
            </ReactUI.QuietButton>
          </HBox>
        </QueryBuilderToolbar>
        <HBox flexGrow={1} height="calc(100% - 35px)" width="100%">
          <LeftPanelWrapper>
            <ui.QueryVis
              domain={domain}
              pointer={pointer}
              selected={selected}
              insertAfter={insertAfter}
              showPanel={showPanel}
              onShowSelect={this.actions.showSelect}
              />
            {pointer.query.context.hasInvalidType &&
              <InvalidQueryNotice
                />}
          </LeftPanelWrapper>
          {(selected || insertAfter) && showPanel && (
            insertAfter ?
              <CenterPanelWrapper>
                <ui.AddQueryPanel
                  onClose={this.actions.hidePanel}
                  pointer={insertAfter}
                  onSearch={this.props.onSearch}
                  disableClose={disablePanelClose}
                  />
              </CenterPanelWrapper> : selected ?
              <CenterPanelWrapper>
                <ui.QueryPanel
                  onClose={this.actions.hidePanel}
                  onSearch={this.props.onSearch}
                  pointer={selected}
                  disableClose={disablePanelClose}
                  />
              </CenterPanelWrapper> :
              null
          )}
          <RightPanelWrapper>
            {
              queryInvalid ?
              <InvalidQueryMessage
                onUndo={this.actions.undo}
                /> :
              data != null ?
              <ui.DataTable
                query={query}
                loading={queryLoading}
                data={data}
                focusedSeq={focusedSeq}
                onFocusedSeq={this.onFocusedSeq}
                /> :
              null
            }
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
        icon={<Icon.ArrowLeftIcon />}
        size="small">
        return back
      </ReactUI.Button>
      to the previous state.
    </ui.Message>
  );
}

function InvalidQueryNotice() {
  return (
    <ui.ErrorPanel borderTop>
      The query is not valid, please either fix it or remove invalid query
      combinators.
    </ui.ErrorPanel>
  );
}

let QueryBuilderToolbar = style(HBox, {
  base: {
    zIndex: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let CenterPanelWrapper = style(VBox, {
  base: {
    flexBasis: '200px',
    flexGrow: 1,
    height: '100%',
    overflow: 'auto',
    boxShadow: css.boxShadow(0, 0, 3, 0, '#aaa'),
  }
});

let RightPanelWrapper = style(VBox, {
  base: {
    flexBasis: '400px',
    flexGrow: 4,
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

function isEmptyQuery(query) {
  if (query.pipeline.length === 1) {
    return true;
  }
  if (query.pipeline.length === 2 && query.pipeline[1].name === 'select') {
    return true;
  }
  return false;
}
