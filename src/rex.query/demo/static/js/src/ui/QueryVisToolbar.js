/**
 * @flow
 */

import type {Query, Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {onQueryCallback} from '../QueryBuilder';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from '@prometheusresearch/react-box';
import IconPointer from 'react-icons/lib/fa/mouse-pointer';
import IconPlus from 'react-icons/lib/fa/plus';
import IconCube from 'react-icons/lib/fa/cube';
import IconFilter from 'react-icons/lib/fa/filter';

import * as qo from '../model/QueryOperation';
import * as q from '../model/Query';
import * as t from '../model/Type';

type QueryVisToolbarProps = {
  pointer: QueryPointer<Query>;
  selected: QueryPointer<Query>;
  onQuery: onQueryCallback;
};

export default class QueryVisToolbar extends React.Component<*, QueryVisToolbarProps, *> {

  render() {
    let {pointer} = this.props;
    return (
      <VBox width="100%" style={{backgroundColor: 'white'}}>
        <HBox>
          <HBox width="25%">
            {canNavigateAt(pointer.query.context) &&
              <ReactUI.QuietButton
                size="x-small"
                width="100%"
                onClick={this.onAddNavigate}
                icon={<IconPointer />}>
                Navigate
              </ReactUI.QuietButton>}
          </HBox>
          <HBox width="25%">
            {canFilterAt(pointer.query.context) &&
              <ReactUI.QuietButton
                size="x-small"
                width="100%"
                onClick={this.onAddFilter}
                icon={<IconFilter />}>
                Filter
              </ReactUI.QuietButton>}
          </HBox>
          <HBox width="25%">
            {canDefineAt(pointer.query.context) &&
              <ReactUI.QuietButton
                size="x-small"
                width="100%"
                onClick={this.onAddDefine}
                icon={<IconPlus />}>
                Define
              </ReactUI.QuietButton>}
          </HBox>
          <HBox width="25%">
            {canAggregateAt(pointer.query.context) &&
              <ReactUI.QuietButton
                size="x-small"
                width="100%"
                onClick={this.onAddAggregate}
                icon={<IconCube />}>
                Aggregate
              </ReactUI.QuietButton>}
          </HBox>
        </HBox>
      </VBox>
    );
  }

  onAddFilter = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {
      query,
      selected: nextSelected
    } = qo.insertAfter(pointer, selected, q.filter(q.navigate('true')));
    onQuery(query, nextSelected);
  };

  onAddNavigate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.navigate('code'));
    onQuery(query, nextSelected);
  };

  onAddAggregate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, onQuery, selected} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.aggregate('count'));
    onQuery(query, nextSelected);
  };

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, onQuery, selected} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.def('name', q.navigate('code')));
    onQuery(query, nextSelected);
  };

}

function canAggregateAt(context: ?Context) {
  return isSeqAt(context);
}

function canFilterAt(context: ?Context) {
  return isSeqAt(context);
}

function canNavigateAt(context: ?Context) {
  let canNavigate = (
    context &&
    context.type &&
    t.atom(context.type).name === 'entity'
  );
  return canNavigate;
}

function canDefineAt(context: ?Context) {
  return isSeqAt(context);
}

function isSeqAt(context: ?Context) {
  return (
    context &&
    context.type &&
    context.type.name === 'seq'
  );
}
