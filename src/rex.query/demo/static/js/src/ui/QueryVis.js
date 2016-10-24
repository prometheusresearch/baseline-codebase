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
      <VBox paddingTop={5} paddingLeft={15}>
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

type QueryVisSelectFieldsetProps = {
  fieldset: Array<QueryPointer<*>>;
  selected: ?QueryPointer<*>;
  topLevel?: boolean;
};

function QueryVisSelectFieldset(props: QueryVisSelectFieldsetProps) {
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

type QueryVisSelectProps = {
  pointer: QueryPointer<q.SelectQuery>;
  selected: ?QueryPointer<*>;
  topLevel?: boolean;
};

export function QueryVisSelect(props: QueryVisSelectProps) {
  let {pointer, topLevel, ...rest} = props;
  let fieldset = getSelectFieldset(pointer);
  return (
    <QueryVisButton
      {...rest}
      disableToolbar
      disableRemove
      label="Select"
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
    backgroundColor: theme.entity.background,
    paddingTop: 5,
    paddingBottom: 5,
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
    paddingBottom: 5,
    paddingLeft: 5,
  }
});

type QueryVisQueryButtonProps = {
  pointer: QueryPointer<Query>;
  selected: ?QueryPointer<Query>;
  disableRemove?: boolean;
};

function QueryVisQueryButton(props: QueryVisQueryButtonProps) {
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
    return (
      <QueryVisSelectCollapsedPipeline
        {...props}
        navigate={first}
        select={last}
        />
    );
  } else if (isSelectPipeline) {
    return (
      <QueryVisSelectPipeline
        {...props}
        navigate={first}
        select={last}
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

type QueryVisSelectPipelineProps = {
  navigate: QueryPointer<q.NavigateQuery> | QueryPointer<q.HereQuery>;
  select: QueryPointer<q.SelectQuery>;
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
};

function QueryVisSelectPipeline({
  pipeline, select, navigate, ...props
}: QueryVisSelectPipelineProps) {
  let items = pipeline.map((pointer, idx) => {
    return (
      <QueryVisPipelineItem key={idx}>
        <QueryVisQueryButton
          {...props}
          pointer={pointer}
          />
      </QueryVisPipelineItem>
    );
  });
  return (
    <QueryVisPipelineRoot>
      <QueryVisPipelineItem>
        <QueryVisQueryButton
          pointer={navigate}
          {...props}
          />
      </QueryVisPipelineItem>
      {items}
      <QueryVisPipelineItem>
        <QueryVisSelect
          pointer={select}
          topLevel={navigate.query.name === 'here'}
          {...props}
          />
      </QueryVisPipelineItem>
    </QueryVisPipelineRoot>
  );
}

type QueryVisSelectCollapsedPipelineProps = {
  navigate: QueryPointer<q.NavigateQuery> | QueryPointer<q.HereQuery>;
  select: QueryPointer<q.SelectQuery>;
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
};

function QueryVisSelectCollapsedPipeline({
  navigate, select, ...props
}: QueryVisSelectCollapsedPipelineProps) {
  let fieldset = getSelectFieldset(select);
  return (
    <QueryVisPipelineRoot>
      <QueryVisPipelineItem>
        <QueryVisQueryButton
          {...props}
          pointer={navigate}
          />
      </QueryVisPipelineItem>
      {fieldset.length > 0 &&
        <QueryVisPipelineItem>
          <QueryVisSelectFieldset
            {...props}
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
