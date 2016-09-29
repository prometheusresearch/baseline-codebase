/**
 * @flow
 */

import type {Query, Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from '@prometheusresearch/react-box';

import * as t from '../model/Type';

type QueryVisToolbarProps = {
  pointer: QueryPointer<Query>;
};

export default class QueryVisToolbar extends React.Component<*, QueryVisToolbarProps, *> {

  context: {actions: QueryBuilderActions};

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {pointer} = this.props;
    return (
      <VBox width="100%" style={{backgroundColor: 'white'}}>
        <HBox padding={2}>
          <ReactUI.FlatButton
            groupHorizontally
            disabled={!canNavigateAt(pointer.query.context)}
            size="x-small"
            width="25%"
            onClick={this.onAddNavigate}
            icon={<PlusIcon />}>
            Navigate
          </ReactUI.FlatButton>
          <ReactUI.FlatButton
            groupHorizontally
            disabled={!canFilterAt(pointer.query.context)}
            size="x-small"
            width="25%"
            onClick={this.onAddFilter}
            icon={<PlusIcon />}>
            Filter
          </ReactUI.FlatButton>
          <ReactUI.FlatButton
            groupHorizontally
            disabled={!canDefineAt(pointer.query.context)}
            size="x-small"
            width="25%"
            onClick={this.onAddDefine}
            icon={<PlusIcon />}>
            Define
          </ReactUI.FlatButton>
          <ReactUI.FlatButton
            groupHorizontally
            disabled={!canAggregateAt(pointer.query.context)}
            size="x-small"
            width="25%"
            onClick={this.onAddAggregate}
            icon={<PlusIcon />}>
            Aggregate
          </ReactUI.FlatButton>
        </HBox>
      </VBox>
    );
  }

  onAddFilter = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.addFilter(this.props.pointer);
  };

  onAddNavigate = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.addNavigate(this.props.pointer);
  };

  onAddAggregate = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.addAggregate(this.props.pointer);
  };

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    this.context.actions.addDefine(this.props.pointer);
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

function PlusIcon() {
  return <span style={{verticalAlign: 'middle'}}>＋</span>;
}
