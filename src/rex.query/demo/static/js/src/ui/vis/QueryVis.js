/**
 * @flow
 */

import type {QueryPointer, Query, Expression} from '../../model';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';

import invariant from 'invariant';

import * as t from '../../model/Type';
import * as q from '../../model/Query';
import * as qp from '../../model/QueryPointer';
import * as QueryButton from '../QueryButton';
import * as QueryPane from '../QueryPane';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButton from './QueryVisButton';

export function QueryVisNavigateButton(props: {
  pointer: QueryPointer<q.NavigateQuery>;
  children?: React$Element<*>;
}) {
  let {pointer, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      disableToggle
      stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
      pointer={pointer}
      label={getColumnTitle(pointer.query)}
      />
  );
}

function getColumnTitle(query: q.NavigateQuery): string {
  if (query.context.domainEntityAttrtibute) {
    return query.context.domainEntityAttrtibute.title;
  } else if (query.context.domainEntity) {
    return query.context.domainEntity.title;
  } else {
    return query.path;
  }
}

export function QueryVisDefineButton(props: {
  binding: React$Element<*>;
  pointer: QueryPointer<q.DefineQuery>;
}) {
  let {pointer, binding, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      stylesheet={{Root: QueryPane.DefinePane, Button: QueryButton.DefineButton}}
      pointer={pointer}
      label={pointer.query.binding.name}>
      <VBox paddingTop={5} paddingLeft={15}>
        {binding}
      </VBox>
    </QueryVisButton>
  );
}

export function QueryVisFilterButton(props: {
  pointer: QueryPointer<q.FilterQuery>;
}) {
  let {query} = props.pointer;
  let label = getLabelForFilterExpression(query.predicate);
  let stylesheet = {
    Root: QueryPane.FilterPane,
    Button: QueryButton.FilterButton,
  };
  return (
    <QueryVisButton
      {...props}
      stylesheet={stylesheet}
      label={label}
      />
  );
}

function getLabelForFilterExpression(expression: Expression): string {
  if (expression.name === 'logicalBinary' && expression.op === 'or') {
    let fields = [];
    expression.expressions.forEach(expr => {
      if (
        !(expr.name === 'value' && expr.value === true) &&
         expr.name === 'binary'
      ) {
        if (expr.left.name === 'navigate' && !fields.includes(expr.left.path)) {
          fields.push(expr.left.path);
        }
      }
    });

    if (fields.length) {
      return `Filter by ${fields.join(', ')}`;
    }
  }
  return 'Filter';
}

export function QueryVisAggregateButton(props: {
  pointer: QueryPointer<q.AggregateQuery>;
}) {
  let {pointer, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      stylesheet={{Root: QueryPane.AggregatePane, Button: QueryButton.AggregateButton}}
      pointer={pointer}
      label={`${pointer.query.aggregate}`}
      />
  );
}

export function QueryVisHere(props: {
  pointer: QueryPointer<q.HereQuery>;
  selected: ?QueryPointer<*>;
}) {
  let {pointer, ...rest} = props;
  // Top level here which represents database.
  let disableRemove = (
    pointer.path.length === 1 &&
    pointer.path[0][0] === 'pipeline' &&
    pointer.path[0][1] === 0
  );
  return (
    <QueryVisButton
      {...rest}
      disableToggle
      disableRemove={disableRemove}
      stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
      pointer={pointer}
      label="Database"
      />
  );
}

function getSelectFieldset(pointer) {
  let items = [];
  for (let name in pointer.query.select) {
    if (!pointer.query.select.hasOwnProperty(name)) {
      continue;
    }
    let type = t.maybeAtom(pointer.query.select[name].context.type);
    if (type == null || type.name === 'entity' || type.name === 'record') {
      items.push(qp.select(pointer, ['select', name]));
    }
  }
  return items;
}

function QueryVisSelectHeader(props: {
  pointer: QueryPointer<q.HereQuery | q.NavigateQuery>;
  selected: ?QueryPointer<*>;
}) {
  const {pointer, selected} = props;
  let stylesheet = {
    Root: QueryPane.DefaultPane,
    Button: QueryButton.DefaultButton,
  };
  let label = pointer.query.name === 'navigate'
    ? getColumnTitle(pointer.query)
    : 'Database';
  return (
    <QueryVisButton
      stylesheet={stylesheet}
      pointer={pointer}
      selected={selected}
      disableSelected
      disableToggle
      label={label}
      />
  );
}

function QueryVisSelectFieldset(props: {
  fieldset: Array<QueryPointer<*>>;
  selected: ?QueryPointer<*>;
  topLevel: boolean;
}) {
  let {fieldset, topLevel, ...rest} = props;
  let items = fieldset.map(pointer =>
    <QueryVisSelectItem key={pointer.path.join('.')} variant={{topLevel}}>
      <QueryVisSelectItemInner>
        <QueryVisQueryButton
          {...rest}
          pointer={pointer}
          />
      </QueryVisSelectItemInner>
    </QueryVisSelectItem>
  );
  if (items.length === 0) {
    return null;
  } else {
    return (
      <VBox paddingLeft={topLevel ? 5 : 0}>
        {items}
      </VBox>
    );
  }
}

export function QueryVisSelect(props: {
  pointer: QueryPointer<q.SelectQuery>;
  selected: ?QueryPointer<*>;
  topLevel: boolean;
}) {
  let {pointer, topLevel, ...rest} = props;
  let fieldset = getSelectFieldset(pointer);
  let label = `Select ${Object.keys(pointer.query.select).join(', ')}`;
  return (
    <QueryVisButton
      {...rest}
      disableToolbar
      disableRemove
      disableToggle
      label={label}
      stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
      pointer={pointer}>
      {fieldset.length > 0 &&
        <VBox paddingTop={5}>
          <QueryVisSelectFieldset
            {...rest}
            topLevel={topLevel}
            fieldset={fieldset}
          />
        </VBox>}
    </QueryVisButton>
  );
}

let QueryVisSelectItem = style(VBox, {
  displayName: 'QueryVisSelectItem',
  base: {
    backgroundColor: '#ccc',
    paddingTop: 5,
    paddingLeft: 5,
    marginBottom: 5,
    lastOfType: {
      marginBottom: 0,
    }
  },
});

let QueryVisSelectItemInner = style(VBox, {
  displayName: 'QueryVisSelectItemInner',
  base: {
    backgroundColor: '#fff',
    paddingTop: 5,
    paddingLeft: 5,
  }
});

function QueryVisQueryButton(props: {
  pointer: QueryPointer<Query>;
  selected: ?QueryPointer<Query>;
  disableRemove?: boolean;
}) {
  const {pointer, disableRemove, ...rest} = props;
  if (pointer.query.name === 'here') {
    return (
      <QueryVisHere
        {...rest}
        disableRemove={disableRemove}
        pointer={((pointer: any): QueryPointer<q.HereQuery>)}
        />
    );
  } else if (pointer.query.name === 'navigate') {
    return (
      <QueryVisNavigateButton
        {...rest}
        pointer={((pointer: any): QueryPointer<q.NavigateQuery>)}
        />
    );
  } else if (pointer.query.name === 'filter') {
    return (
      <QueryVisFilterButton
        {...rest}
        pointer={((pointer: any): QueryPointer<q.FilterQuery>)}
        />
    );
  } else if (pointer.query.name === 'pipeline') {
    return (
      <QueryVisPipeline
        {...rest}
        disableRemove={disableRemove}
        pipeline={qp.spread(pointer)}
        />
    );
  } else if (pointer.query.name === 'select') {
    return (
      <QueryVisSelect
        {...rest}
        topLevel={false}
        pointer={((pointer: any): QueryPointer<q.SelectQuery>)}
        />
    );
  } else if (pointer.query.name === 'define') {
    const bindingPointer = qp.select(pointer, ['binding', 'query']);
    return (
      <QueryVisDefineButton
        {...rest}
        pointer={((pointer: any): QueryPointer<q.DefineQuery>)}
        binding={
          <QueryVisQueryButton
            {...rest}
            pointer={bindingPointer}
            />
          }
        />
    );
  } else if (pointer.query.name === 'aggregate') {
    return (
      <QueryVisAggregateButton
        {...rest}
        pointer={((pointer: any): QueryPointer<q.AggregateQuery>)}
        />
    );
  } else if (pointer.query.name === 'select') {
    return null;
  } else if (pointer.query.name === 'limit') {
    return null;
  } else {
    invariant(false, 'Unknown query type: %s', pointer.query.name);
  }
}

function QueryVisPipeline({pipeline, disableRemove, ...props}: {
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
  disableRemove?: boolean;
}) {
  let first = pipeline[0];
  let last = pipeline[pipeline.length - 1];
  let isSelectPipeline = (
    pipeline.length >= 2 &&
    (first.query.name === 'here' || first.query.name === 'navigate') &&
    last.query.name === 'select'
  );
  let isSelectCollapsedPipeline = (
    isSelectPipeline &&
    pipeline.length === 2
  );
  if (isSelectCollapsedPipeline) {
    let navigate: QueryPointer<q.NavigateQuery | q.HereQuery> = (first: any);
    let select: QueryPointer<q.SelectQuery> = (last: any);
    return (
      <QueryVisSelectCollapsedPipeline
        {...props}
        navigate={navigate}
        select={select}
        />
    );
  } else if (isSelectPipeline) {
    let navigate: QueryPointer<q.NavigateQuery | q.HereQuery> = (first: any);
    let select: QueryPointer<q.SelectQuery> = (last: any);
    return (
      <QueryVisSelectPipeline
        {...props}
        navigate={navigate}
        select={select}
        pipeline={pipeline.slice(1, pipeline.length - 1)}
        />
    );
  } else {
    let items = pipeline.map((pointer, idx) => {
      return (
        <QueryVisPipelineItem key={idx}>
          <QueryVisQueryButton
            {...props}
            disableRemove={disableRemove && idx === 0}
            pointer={pointer}
            />
        </QueryVisPipelineItem>
      );
    });
    return (
      <QueryVisPipelineRoot>
        {items}
      </QueryVisPipelineRoot>
    );
  }
}

function QueryVisSelectPipeline({
  pipeline, select, navigate, selected
}: {
  navigate: QueryPointer<q.NavigateQuery | q.HereQuery>;
  select: QueryPointer<q.SelectQuery>;
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
}) {
  let isSelected = (
    qp.is(selected, navigate) ||
    qp.is(selected, select)
  );
  let items = pipeline.map((pointer, idx) => {
    return (
      <QueryVisPipelineItem key={idx}>
        <QueryVisQueryButton
          pointer={pointer}
          selected={selected}
          />
      </QueryVisPipelineItem>
    );
  });
  return (
    <QueryVisPipelineRoot>
      <QueryVisPipelineItem>
        <QueryVisSelectHeader
          pointer={navigate}
          selected={selected}
          />
      </QueryVisPipelineItem>
      {items}
      <QueryVisPipelineItem>
        <QueryVisSelect
          pointer={select}
          selected={selected}
          isSelected={isSelected}
          topLevel={navigate.query.name === 'here'}
          />
      </QueryVisPipelineItem>
    </QueryVisPipelineRoot>
  );
}

function QueryVisSelectCollapsedPipeline({
  navigate, select, selected, ...props
}: {
  navigate: QueryPointer<q.NavigateQuery | q.HereQuery>;
  select: QueryPointer<q.SelectQuery>;
  selected: ?QueryPointer<Query>;
}) {
  let fieldset = getSelectFieldset(select);
  let isSelected = (
    qp.is(selected, navigate) ||
    qp.is(selected, select)
  );
  return (
    <QueryVisPipelineRoot>
      <QueryVisPipelineItem>
        <QueryVisQueryButton
          {...props}
          isSelected={isSelected}
          selected={selected}
          pointer={navigate}
          />
      </QueryVisPipelineItem>
      {fieldset.length > 0 &&
        <QueryVisPipelineItem>
          <QueryVisSelectFieldset
            {...props}
            isSelected={isSelected}
            selected={selected}
            fieldset={fieldset}
            topLevel={navigate.query.name === 'here'}
            />
        </QueryVisPipelineItem>}
    </QueryVisPipelineRoot>
  );
}

let QueryVisPipelineRoot = style(VBox, {
  displayName: 'QueryVisPipelineRoot',
  base: {
    backgroundColor: '#fff',
  }
});

let QueryVisPipelineItem = style(VBox, {
  displayName: 'QueryVisPipelineItem',
  base: {
    marginBottom: 5,
    lastOfType: {
      marginBottom: 0,
    }
  }
});

type QueryVisProps = {
  pointer: QueryPointer<Query>;
  onShowSelect: () => *;
  selected: ?QueryPointer<Query>;
};

/**
 * Render graphical query representation.
 */
export class QueryVis extends React.Component<*, QueryVisProps, *> {

  render() {
    let {pointer, selected} = this.props;
    return (
      <VBox
        grow={1}
        paddingTop={5}>
        <QueryVisQueryButton
          disableRemove
          selected={selected}
          pointer={pointer}
          />
        {pointer.query.name !== 'here' && selected == null &&
          <VBox padding={5} paddingBottom={0}>
            <QueryVisToolbar
              pointer={pointer}
              selected={pointer}
              />
          </VBox>}
      </VBox>
    );
  }

  onShowSelect = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onShowSelect();
  };

}
