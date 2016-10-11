/**
 * @flow
 */

import type {Query, Context, QueryPointer, Type} from '../model';
import type {Actions} from '../state';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox} from '@prometheusresearch/react-box';

import * as t from '../model/Type';

type QueryVisToolbarProps = {
  pointer: ?QueryPointer<Query>;
  mode: string;
  hideDisabled?: boolean;
};

export default class QueryVisToolbar extends React.Component<*, QueryVisToolbarProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  static defaultProps = {
    mode: 'append',
  };

  render() {
    let {pointer, mode, hideDisabled} = this.props;
    let type;
    if (mode === 'prepend') {
      if (pointer) {
        type = pointer.query.context.inputType;
      } else {
        type = t.voidType;
      }
    } else {
      if (pointer) {
        type = pointer.query.context.type;
      } else {
        type = t.voidType;
      }
    }
    let canNavigate = canNavigateAt(type);
    let canFilter = canFilterAt(type);
    let canDefine = canDefineAt(type);
    let canAggregate = canAggregateAt(type);
    return (
      <VBox width="100%" style={{backgroundColor: 'white'}}>
        <HBox padding={2}>
          {(!hideDisabled || (hideDisabled && canFilter)) &&
            <ReactUI.QuietButton
              groupHorizontally
              disabled={!canFilterAt(type)}
              size="x-small"
              width="25%"
              onClick={this.onAddFilter}
              icon={<PlusIcon />}>
              Filter
            </ReactUI.QuietButton>}
          {(!hideDisabled || (hideDisabled && canDefine)) &&
            <ReactUI.QuietButton
              groupHorizontally
              disabled={!canDefineAt(type)}
              size="x-small"
              width="25%"
              onClick={this.onAddDefine}
              icon={<PlusIcon />}>
              Define
            </ReactUI.QuietButton>}
          {(!hideDisabled || (hideDisabled && canAggregate)) &&
            <ReactUI.QuietButton
              groupHorizontally
              disabled={!canAggregateAt(type)}
              size="x-small"
              width="25%"
              onClick={this.onAddAggregate}
              icon={<PlusIcon />}>
              Aggregate
            </ReactUI.QuietButton>}
          {(!hideDisabled || (hideDisabled && canNavigate)) &&
            <ReactUI.QuietButton
              groupHorizontally
              disabled={!canNavigateAt(type)}
              size="x-small"
              width="25%"
              onClick={this.onAddNavigate}
              icon={<PlusIcon />}>
              Navigate
            </ReactUI.QuietButton>}
        </HBox>
      </VBox>
    );
  }

  onAddNavigate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer} = this.props; 
    if (this.props.mode === 'prepend') {
      this.context.actions.prependNavigate({pointer});
    } else {
      this.context.actions.appendNavigate({pointer});
    }
  };

  onAddFilter = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer} = this.props; 
    if (this.props.mode === 'prepend') {
      this.context.actions.prependFilter({pointer});
    } else {
      this.context.actions.appendFilter({pointer});
    }
  };

  onAddAggregate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer} = this.props; 
    if (this.props.mode === 'prepend') {
      this.context.actions.prependAggregate({pointer});
    } else {
      this.context.actions.appendAggregate({pointer});
    }
  };

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer} = this.props; 
    if (this.props.mode === 'prepend') {
      this.context.actions.prependDefine({pointer});
    } else {
      this.context.actions.appendDefine({pointer});
    }
  };

}

function canAggregateAt(type: ?Type) {
  return isSeqAt(type);
}

function canFilterAt(type: ?Type) {
  return isSeqAt(type);
}

function canNavigateAt(type: ?Type) {
  let canNavigate = (
    type && (
      (type.name === 'seq' && type.type.name === 'entity') ||
      type.name === 'void'
    )
  );
  return canNavigate;
}

function canDefineAt(type: ?Type) {
  return (
    type && (
      (type.name === 'seq' && type.type.name === 'entity')
      || type.name === 'void'
    )
  );
}

function isSeqAt(type: ?Type) {
  return (
    type &&
    type.name === 'seq'
  );
}

function PlusIcon() {
  return <span style={{verticalAlign: 'middle'}}>＋</span>;
}
