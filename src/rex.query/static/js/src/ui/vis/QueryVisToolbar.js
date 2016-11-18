/**
 * @flow
 */

import type {Query, QueryPointer, Type} from '../../model';
import type {Actions} from '../../state';

import React from 'react';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as t from '../../model/Type';

import PlusIcon from '../PlusIcon';

type QueryVisToolbarProps = {

  /**
   * Pointer on which the toolbar operates.
   */
  pointer: QueryPointer<Query>;

  disableAdd?: boolean;
};

export default class QueryVisToolbar
  extends React.Component<*, QueryVisToolbarProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {pointer, disableAdd} = this.props;
    let type = pointer.query.context.type;
    let canNavigate = canNavigateAt(type);
    let canFilter = canFilterAt(type);
    let canAggregate = canAggregateAt(type);
    let hasGroupBy = hasGroupByAt(type);
    if (!canNavigate && !canAggregate && !canFilter && !hasGroupBy) {
      return null;
    }
    return (
      <VBox height={32} width="100%" style={{backgroundColor: 'white'}}>
        <HBox padding={2} justifyContent="flex-start">
          {canNavigate &&
            <QueryVisToolbarButton
              emphasis
              disabled={disableAdd}
              onClick={this.onAdd}
              icon={<PlusIcon />}>
              Add
            </QueryVisToolbarButton>}
          {canFilter &&
            <QueryVisToolbarButton
              onClick={this.onFilter}
              icon={<PlusIcon />}>
              Filter
            </QueryVisToolbarButton>}
          {hasGroupBy &&
            <QueryVisToolbarButton
              onClick={this.onAddGroupQuery.bind(null, hasGroupBy)}
              icon={<PlusIcon />}>
              Add {hasGroupBy} Query
            </QueryVisToolbarButton>}
        </HBox>
      </VBox>
    );
  }

  onAdd = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.insertAfter(this.props.pointer);
  };

  onFilter = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendFilter({pointer: this.props.pointer});
  };

  onAddGroupQuery = (path: string, ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendDefine({
      pointer: this.props.pointer,
      path: [path],
      select: true,
    });
  };

  onAggregate = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendAggregate({pointer: this.props.pointer});
  };

}

let QueryVisToolbarButtonRoot = style(HBox, {
  displayName: 'QueryVisToolbarButtonRoot',
  base: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,

    justifyContent: 'center',
    userSelect: 'none',
    alignItems: 'center',
    cursor: 'default',

    textTransform: 'capitalize',
    fontSize: '12px',
    fontWeight: 300,

    color: '#585858',
    backgroundColor: '#ffffff',

    hover: {
      color: '#000000',
    },
    active: {
      backgroundColor: '#fafafa',
    }
  },
  emphasis: {
    border: css.border(1, '#ccc'),
    borderRadius: 2,
  },
  selected: {
    fontWeight: 500,
    color: '#1f85f5',
    hover: {
      color: '#1f85f5',
    },
  },
  disabled: {
    cursor: 'not-allowed',
    color: '#aaa',
    hover: {
      color: '#aaa',
    },
    active: {
      backgroundColor: '#ffffff',
    }
  },
});

function QueryVisToolbarButton({children, selected, icon, disabled, emphasis, ...props}) {
  let variant = {selected, disabled, emphasis};
  return (
    <QueryVisToolbarButtonRoot
      {...props}
      aria-role="button"
      variant={variant}>
      {icon && <HBox paddingRight={5}>{icon}</HBox>}
      {children}
    </QueryVisToolbarButtonRoot>
  );
}

function canAggregateAt(type: Type) {
  return isSeqAt(type);
}

function canFilterAt(type: Type) {
  return isSeqAt(type);
}

function canNavigateAt(type: Type) {
  return type.name === 'record' || type.name === 'void';
}

function isSeqAt(type: Type) {
  return type.card === 'seq';
}

function hasGroupByAt(type: Type) {
  if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    let hasGroupBy = false;
    let entityName = null;
    for (let k in attribute) {
      if (!attribute.hasOwnProperty(k)) {
        continue;
      }
      if (attribute[k].groupBy) {
        hasGroupBy = true;
      }
      if (attribute[k].type.name === 'record') {
        entityName = k;
      }
    }
    if (hasGroupBy) {
      return entityName;
    }
  }
  return null;
}
