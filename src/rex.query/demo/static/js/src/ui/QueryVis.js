/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';

import invariant from 'invariant';
import color from 'color';

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as theme from './Theme';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButton, {QueryVisButtonLabel} from './QueryVisButton';

function createButton(displayName, theme) {
  let Root = style(HBox, {
    displayName: `${displayName}Root`,
    base: {
      color: theme.color,

      justifyContent: 'center',
      userSelect: 'none',
      cursor: 'default',
      fontSize: '10px',
      alignItems: 'center',

      hover: {
        color: color(theme.color).darken(0.1).rgbString(),
        backgroundColor: css.rgba(255, 255, 255, 0.15),
      },
    },

    enableActive: {
      active: {
        color: theme.background,
        backgroundColor: theme.color,
      },
    }

  });

  return class extends React.Component {
    static displayName = displayName;
    render() {
      let {children, icon, disableActive, ...props} = this.props;
      let variant = {enableActive: !disableActive};
      return (
        <Root {...props} variant={variant} paddingH={7} paddingV={5}>
          {icon && <HBox paddingRight={5}>{icon}</HBox>}
          {children}
        </Root>
      );
    }
  }
}

function createPanel(displayName, theme) {
  return style(VBox, {
    displayName,
    base: {
      backgroundColor: theme.background,
      color: theme.color,
    },
    selected: {
      zIndex: 1,
      boxShadow: css.boxShadow(0, 1, 2, 0, '#bbb'),
      backgroundColor: color(theme.background).darken(0.2).rgbString(),
    }
  });
}

let NavigateButton = createButton('NavigateButton', theme.entity);
let AggregateButton = createButton('AggregateButton', theme.aggregate);
let DefineButton = createButton('AggregateButton', theme.traverse);
let FilterButton = createButton('FilterButton', theme.filter);

let NavigatePanel = createPanel('NavigatePanel', theme.entity);
let AggregatePanel = createPanel('AggregatePanel', theme.aggregate);
let DefinePanel = createPanel('AggregatePanel', theme.traverse);
let FilterPanel = createPanel('FilterPanel', theme.filter);
let SelectPanel = createPanel('SelectPanel', theme.select);

type QueryVisNavigateButtonProps = {
  pointer: QueryPointer<q.NavigateQuery>;
  children?: React$Element<*>;
};

export function QueryVisNavigateButton(props: QueryVisNavigateButtonProps) {
  let {pointer, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      stylesheet={{Root: NavigatePanel, Button: NavigateButton}}
      pointer={pointer}
      label={`Navigate: ${getColumnTitle(pointer.query)}`}
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
      stylesheet={{Root: DefinePanel, Button: DefineButton}}
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
      stylesheet={{Root: FilterPanel, Button: FilterButton}}
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
      stylesheet={{Root: AggregatePanel, Button: AggregateButton}}
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
  if (query.name === 'navigate') {
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
  pointer: ?QueryPointer<Query>;
  onAddColumn: () => *;
  showAddColumnPanel: boolean;
  selected: ?QueryPointer<Query>;
};

/**
 * Render graphical query representation.
 */
export class QueryVis extends React.Component<*, QueryVisProps, *> {

  render() {
    let {pointer, selected, showAddColumnPanel} = this.props;
    return (
      <VBox
        paddingV={10}
        grow={1}>
        {pointer &&
          <QueryVisPipeline
            selected={selected}
            pipeline={qp.spread(pointer)}
            />}
        {selected == null &&
          <VBox padding={5} paddingBottom={0}>
            <QueryVisToolbar
              pointer={pointer}
              selected={pointer}
              />
          </VBox>}
        <VBox alignSelf="flex-end" paddingV={5} width="100%">
          <SelectPanel
            padding={4}
            paddingLeft={30}
            variant={{selected: showAddColumnPanel}}>
            <QueryVisButtonLabel onClick={this.onAddColumn}>
              <HBox grow={1} alignItems="center">
                Configure columns
              </HBox>
            </QueryVisButtonLabel>
          </SelectPanel>
        </VBox>
      </VBox>
    );
  }

  onAddColumn = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onAddColumn();
  };

}
