/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-dom-stylesheet/css';
import * as ReactUI from '@prometheusresearch/react-ui';
import CloseIcon from 'react-icons/lib/fa/close';

import * as q from '../model/Query';
import * as qo from '../model/QueryOperation';
import * as theme from './Theme';
import AttributePicker from './AttributePicker';

type QueryPanelProps = {
  pointer: ?QueryPointer<>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  onClose: () => *;
};

export function QueryPanel(props: QueryPanelProps) {
  const {pointer, onQuery, onClose} = props;
  if (pointer == null) {
    return null;
  }

  switch (pointer.query.name) {
    case 'pipeline':
      return null;
    case 'navigate':
      return (
        <NavigateQueryPanel
          pointer={pointer}
          onClose={onClose}
          onQuery={onQuery}
          />
      );
    case 'filter':
      return (
        <QueryPanelBase
          onClose={onClose}
          theme={theme.filter}
          onQuery={onQuery}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'define':
      return (
        <QueryPanelBase
          onClose={onClose}
          theme={theme.traverse}
          onQuery={onQuery}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'aggregate':
      return (
        <QueryPanelBase
          onClose={onClose}
          theme={theme.aggregate}
          onQuery={onQuery}
          pointer={pointer}>
        </QueryPanelBase>
      );
    case 'select':
      return null;
    case 'limit':
      return null;
    default:
      return null
  }
}

type QueryPanelBaseProps = {
  pointer: QueryPointer<>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  theme: {background: string; color: string};
  children: React$Element<*>;
  onClose: () => *;
};

class QueryPanelBase extends React.Component<*, QueryPanelBaseProps, *> {

  onRemove = () => {
    let {pointer, onQuery} = this.props;
    let {query} = qo.removeAt(pointer);
    onQuery(query);
  };

  render() {
    let {theme, children, pointer, onClose} = this.props;

    return (
      <VBox
        height="100%"
        style={{
          borderLeft: css.border(5, theme.background)
        }}>
        <VBox padding={10}>
          <HBox marginBottom={10}>
            <HBox grow={1}>
              {pointer.query.name}
            </HBox>
            <ReactUI.QuietButton
              size="small"
              icon={<CloseIcon />}
              onClick={onClose}
              />
          </HBox>
          <VBox marginBottom={20}>
            {children}
          </VBox>
          <VBox marginBottom={20}>
            <ReactUI.FlatDangerButton size="small" onClick={this.onRemove}>
              Remove
            </ReactUI.FlatDangerButton>
          </VBox>
        </VBox>
      </VBox>
    );
  }
}

type NavigateQueryPanelProps = {
  pointer: QueryPointer<q.NavigateQuery>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  onClose: () => *;
};

class NavigateQueryPanel extends React.Component<*, NavigateQueryPanelProps, *> {

  render() {
    let {pointer, onClose, onQuery} = this.props;
    let {query} = pointer;
    return (
      <QueryPanelBase
        onClose={onClose}
        theme={theme.entity}
        onQuery={onQuery}
        pointer={pointer}>
        <AttributePicker
          pointer={pointer}
          path={query.path}
          />
      </QueryPanelBase>
    );
  }
}
