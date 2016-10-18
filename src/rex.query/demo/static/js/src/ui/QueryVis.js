/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';

import invariant from 'invariant';

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButton, {QueryVisButtonLabel} from './QueryVisButton';
import * as QueryButton from './QueryButton';
import * as QueryPane from './QueryPane';

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
  return (
    <QueryVisButton
      {...props}
      stylesheet={{Root: QueryPane.FilterPane, Button: QueryButton.FilterButton}}
      label="Filter"
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
      label={`Aggregate: ${pointer.query.aggregate}`}
      />
  );
}

type QueryVisQueryButtonProps = {
  pointer: QueryPointer<Query>;
  selected: ?QueryPointer<Query>;
};

function QueryVisQueryButton(props: QueryVisQueryButtonProps) {
  const {pointer: {query, keyPath, prev}, ...rest} = props;
  if (query.name === 'here') {
    return null;
  } else if (query.name === 'navigate') {
    const p: QueryPointer<q.NavigateQuery> = {query, keyPath, prev};
    return (
      <QueryVisNavigateButton
        {...rest}
        pointer={p}
        />
    );
  } else if (query.name === 'filter') {
    const p: QueryPointer<q.FilterQuery> = {query, keyPath, prev};
    return (
      <QueryVisFilterButton
        {...rest}
        pointer={p}
        />
    );
  } else if (query.name === 'pipeline') {
    return (
      <QueryVisPipeline
        {...rest}
        pipeline={qp.spread(props.pointer)}
        />
    );
  } else if (query.name === 'define') {
    const p: any = props.pointer;
    const bindingPointer = qp.select(p, ['binding', 'query']);
    return (
      <QueryVisDefineButton
        {...rest}
        pointer={p}
        binding={
          <QueryVisQueryButton
            {...rest}
            pointer={bindingPointer}
            />
          }
        />
    );
  } else if (query.name === 'aggregate') {
    const p: QueryPointer<q.AggregateQuery> = {query, keyPath, prev};
    return (
      <QueryVisAggregateButton
        {...rest}
        pointer={p}
        />
    );
  } else if (query.name === 'select') {
    return null;
  } else if (query.name === 'limit') {
    return null;
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

type QueryVisPipelineProps = {
  pipeline: Array<QueryPointer<Query>>;
  selected: ?QueryPointer<Query>;
};

function QueryVisPipeline({pipeline, ...props}: QueryVisPipelineProps) {
  let items = pipeline.map((pointer, idx) =>
    <QueryVisPipelineItem key={idx}>
      <QueryVisQueryButton
        {...props}
        pointer={pointer}
        />
    </QueryVisPipelineItem>
  );
  return (
    <QueryVisPipelineRoot>
      {items}
    </QueryVisPipelineRoot>
  );
}

let QueryVisPipelineRoot = style(VBox, {
  base: {
    backgroundColor: '#fff',
  }
});

let QueryVisPipelineItem = style(VBox, {
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
  showPanel: boolean;
  selected: ?QueryPointer<Query>;
};

/**
 * Render graphical query representation.
 */
export class QueryVis extends React.Component<*, QueryVisProps, *> {

  render() {
    let {pointer, selected, showPanel} = this.props;
    return (
      <VBox
        grow={1}>
        <VBox padding={5}>
          <QueryVisToolbar
            mode="prepend"
            hideDisabled
            pointer={pointer}
            selected={pointer}
            />
        </VBox>
        <QueryVisQueryButton
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
        <VBox alignSelf="flex-end" paddingV={5} width="100%">
          <QueryPane.SelectPane
            padding={4}
            paddingLeft={30}
            variant={{selected: showPanel && selected == null}}>
            <QueryVisButtonLabel onClick={this.onShowSelect}>
              <HBox grow={1} alignItems="center">
                Explore
              </HBox>
            </QueryVisButtonLabel>
          </QueryPane.SelectPane>
        </VBox>
      </VBox>
    );
  }

  onShowSelect = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onShowSelect();
  };

}
