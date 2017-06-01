/**
 * @flow
 */

import type {QueryPipeline, Type} from '../../model/types';
import type {Actions} from '../../state';

import React from 'react';
import {style, css, VBox, HBox} from 'react-stylesheet';
import * as t from '../../model/Type';
import * as qo from '../../model/QueryOperation';

type QueryVisToolbarProps = {
  /**
   * Pointer on which the toolbar operates.
   */
  pipeline: QueryPipeline,

  disableAdd?: boolean,
};

export default class QueryVisToolbar extends React.Component<*, QueryVisToolbarProps, *> {
  context: {
    actions: Actions,
  };

  static contextTypes = {actions: React.PropTypes.object};

  render() {
    let {pipeline, disableAdd} = this.props;
    let type = qo.getInsertionPoint(pipeline).context.type;
    let canNavigate = canNavigateAt(type);
    let canFilter = canFilterAt(type);
    let canAggregate = canAggregateAt(type);
    let hasGroupBy = hasGroupByAt(type);
    if (!canNavigate && !canAggregate && !canFilter && !hasGroupBy) {
      return null;
    }
    return (
      <VBox width="100%" style={{backgroundColor: 'white'}}>
        <HBox padding={2} justifyContent="flex-start">
          {(canNavigate || canAggregate || canFilter) &&
            <QueryVisToolbarButton disabled={disableAdd} onClick={this.onAdd}>
              Link
            </QueryVisToolbarButton>}
          {hasGroupBy &&
            <QueryVisToolbarButton onClick={this.onAddGroupQuery.bind(null, hasGroupBy)}>
              Link complement
            </QueryVisToolbarButton>}
          {canFilter &&
            <QueryVisToolbarButton onClick={this.onFilter}>
              Filter
            </QueryVisToolbarButton>}
          {canAggregate &&
            <QueryVisToolbarButton onClick={this.onAggregate}>
              Summarize
            </QueryVisToolbarButton>}
          {canAggregate &&
            <QueryVisToolbarButton onClick={this.onGroup}>
              Group
            </QueryVisToolbarButton>}
        </HBox>
      </VBox>
    );
  }

  onAdd = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.setActiveQueryPipeline({pipeline: this.props.pipeline});
  };

  onFilter = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendFilter({at: this.props.pipeline});
  };

  onGroup = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendGroup({at: this.props.pipeline});
  };

  onAddGroupQuery = (path: string, ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendDefine({
      at: this.props.pipeline,
      path: [path],
      select: true,
    });
  };

  onAggregate = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.appendAggregate({at: this.props.pipeline});
  };
}

let QueryVisToolbarButtonRoot = style('button', {
  displayName: 'QueryVisToolbarButtonRoot',
  base: {
    padding: {horizontal: 7, vertical: 5},

    justifyContent: 'center',
    userSelect: 'none',
    alignItems: 'center',
    cursor: 'default',
    border: 'none',

    textTransform: 'capitalize',
    fontSize: '11px',
    fontWeight: 300,

    color: '#666',
    backgroundColor: '#ffffff',

    borderRight: '1px solid #eee',
    lastChild: {
      borderRight: 'none',
    },

    hover: {
      color: '#000000',
    },
    active: {
      backgroundColor: '#fafafa',
    },
    focus: {
      outline: 'none',
      backgroundColor: '#fafafa',
    },
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
    },
  },
});

type QueryVisToolbarButtonProps = {
  children: React$Element<mixed>,
  selected?: boolean,
  disabled?: boolean,
  emphasis?: boolean,
  icon?: React$Element<mixed>,
};

function QueryVisToolbarButton({
  children,
  selected,
  icon,
  disabled,
  emphasis,
  ...props
}: QueryVisToolbarButtonProps) {
  let variant = {selected, disabled};
  return (
    <QueryVisToolbarButtonRoot {...props} variant={variant}>
      {icon && <HBox paddingRight={5}>{icon}</HBox>}
      {children}
    </QueryVisToolbarButtonRoot>
  );
}

function canAggregateAt(type: Type) {
  return type.card === 'seq';
}

function canFilterAt(type: Type) {
  return type.name === 'record' && type.card === 'seq';
}

function canNavigateAt(type: Type) {
  return type.name === 'record' || type.name === 'void';
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
