/**
 * @flow
 */

import type {Query, Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {QueryBuilderActions} from '../QueryBuilder';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from '@prometheusresearch/react-box';
import IconPointer from 'react-icons/lib/fa/mouse-pointer';
import IconPlus from 'react-icons/lib/fa/plus';
import IconCube from 'react-icons/lib/fa/cube';
import IconFilter from 'react-icons/lib/fa/filter';

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
