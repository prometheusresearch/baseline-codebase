/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';

import invariant from 'invariant';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButton from './QueryVisButton';
import * as QueryButton from './QueryButton';
import * as QueryPane from './QueryPane';
import * as theme from './Theme';

type QueryVisNavigateButtonProps = {
  pointer: QueryPointer<q.NavigateQuery>;
  children?: React$Element<*>;
};

export function QueryVisNavigateButton(props: QueryVisNavigateButtonProps) {
  let {pointer, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
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

type QueryVisDefineButtonProps = {
  binding: React$Element<*>;
  pointer: QueryPointer<q.DefineQuery>;
};

export function QueryVisDefineButton(props: QueryVisDefineButtonProps) {
  let {pointer, binding, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      stylesheet={{Root: QueryPane.DefinePane, Button: QueryButton.DefineButton}}
      pointer={pointer}
      label={`Define: ${pointer.query.binding.name}`}>
      <VBox paddingTop={5}>
        {binding}
      </VBox>
    </QueryVisButton>
  );
}

type QueryVisFilterButtonProps = {
  pointer: QueryPointer<q.FilterQuery>;
};

export function QueryVisFilterButton(props: QueryVisFilterButtonProps) {
  let {query} = props.pointer;

  let label = 'Filter';
  if (query.predicate.name === 'or') {
    let fields = [];
    query.predicate.expressions.forEach((exp) => {
      if ((exp !== true) && exp.left && (exp.left.name === 'navigate')) {
        if (!fields.includes(exp.left.path)) {
          fields.push(exp.left.path);
        }
      }
    });

    if (fields.length) {
      label = `Filter by ${fields.join(', ')}`;
    }
  }

  return (
    <QueryVisButton
      {...props}
      stylesheet={{Root: QueryPane.FilterPane, Button: QueryButton.FilterButton}}
      label={label}
      />
  );
}

type QueryVisAggregateButtonProps = {
  pointer: QueryPointer<q.AggregateQuery>;
};

export function QueryVisAggregateButton(props: QueryVisAggregateButtonProps) {
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

type QueryVisHereProps = {
  pointer: QueryPointer<q.HereQuery>;
  selected: ?QueryPointer<*>;
};

export function QueryVisHere(props: QueryVisHereProps) {
  let {pointer, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
      pointer={pointer}
      label="Database"
      />
  );
}

type QueryVisSelectProps = {
  pointer: QueryPointer<q.SelectQuery>;
  selected: ?QueryPointer<*>;
  skipSelect?: boolean;
};

export function QueryVisSelect(props: QueryVisSelectProps) {
  let {pointer, skipSelect, ...rest} = props;
  let items = [];
  for (let name in pointer.query.select) {
    if (!pointer.query.select.hasOwnProperty(name)) {
      continue;
    }
    let type = t.maybeAtom(pointer.query.select[name].context.type);
    if (type == null || type.name === 'entity' || type.name === 'record') {
      items.push(
        <QueryVisSelectItem key={name}>
          <QueryVisSelectItemInner>
            <QueryVisQueryButton
              {...rest}
              pointer={qp.select(pointer, ['select', name])}
              />
          </QueryVisSelectItemInner>
        </QueryVisSelectItem>
      );
    }
  }
  if (skipSelect) {
    return (
      <VBox paddingTop={5} paddingLeft={20}>
        {items}
      </VBox>
    );
  } else {
    return (
      <QueryVisButton
        {...rest}
        disableToolbar
        disableRemove
        label="Select"
        stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
        pointer={pointer}>
        {items.length > 0 &&
          <VBox paddingTop={5}>
            {items}
          </VBox>}
      </QueryVisButton>
    );
  }
}

let QueryVisSelectItem = style(VBox, {
  displayName: 'QueryVisSelectItem',
  base: {
    backgroundColor: theme.entity.background,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    marginBottom: 5,
  }
});

let QueryVisSelectItemInner = style(VBox, {
  displayName: 'QueryVisSelectItemInner',
  base: {
    backgroundColor: '#fff',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
  }
});

type QueryVisQueryButtonProps = {
  pointer: QueryPointer<Query>;
  selected: ?QueryPointer<Query>;
  disableRemove?: boolean;
  skipSelect?: boolean;
};

function QueryVisQueryButton(props: QueryVisQueryButtonProps) {
  const {pointer, disableRemove, skipSelect, ...rest} = props;
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
        skipSelect={skipSelect}
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

type QueryVisPipelineProps = {
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
  disableRemove?: boolean;
};

function QueryVisPipeline({pipeline, disableRemove, ...props}: QueryVisPipelineProps) {
  let skipSelect = (
    pipeline.length === 2 &&
    (pipeline[0].query.name === 'here' || pipeline[0].query.name === 'navigate')
  );
  let items = pipeline.map((pointer, idx) => {
    // Skip select in 2-pipeline which start with navigate
    if (
      pipeline.length === 2 &&
      idx === 1 &&
      pipeline[0].query.name === 'navigate' &&
      pipeline[1].query.name === 'select'
    ) {
      return null;
    }
    return (
      <QueryVisPipelineItem key={idx}>
        <QueryVisQueryButton
          {...props}
          skipSelect={skipSelect}
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

let QueryVisPipelineRoot = style(VBox, {
  displayName: 'QueryVisPipelineRoot',
  base: {
    backgroundColor: '#fff',
  }
});

let QueryVisPipelineItem = style(VBox, {
  displayName: 'QueryVisPipelineItem',
  base: {
    paddingBottom: 5,
    lastOfType: {
      paddingBottom: 0,
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
