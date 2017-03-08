/**
 * @flow
 */

import {
  type QueryPipeline,
  type QueryAtom,
  type NavigateQuery,
  type DefineQuery,
  type AggregateQuery,
  type FilterQuery,
  type GroupQuery,
} from '../../model';
import type {Actions} from '../../state';

import React from 'react';
import {style, css, Element, VBox, HBox} from 'react-stylesheet';

import invariant from 'invariant';

import ArrowDown from '../ArrowDown';
import * as Icon from '../Icon';
import * as QueryButton from '../QueryButton';
import * as QueryPane from '../QueryPane';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButtonBase from './QueryVisButton';

class QueryVisButton extends React.Component {
  props: {
    query: QueryAtom,
    selected: ?QueryAtom,
  };

  context: {
    actions: Actions,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onSelect = () => {
    this.context.actions.setSelected({query: this.props.query});
  };

  onClose = () => {
    this.context.actions.remove({at: this.props.query});
  };

  render() {
    let {query, selected, ...props} = this.props;
    let isSelected = selected && selected.id === query.id;
    let isInvalid = query.context.hasInvalidType;
    return (
      <QueryVisButtonBase
        {...props}
        closeTitle="Remove"
        onClose={this.onClose}
        onSelect={this.onSelect}
        selected={isSelected}
        invalid={isInvalid}
      />
    );
  }
}

class QueryVisInsertAfterButton extends React.Component {
  props: {
    query: QueryPipeline,
    first?: boolean,
  };

  render() {
    let stylesheet = {
      Root: QueryPane.DefaultPane,
      Button: QueryButton.DefaultButton,
    };
    let {first} = this.props;
    return <QueryVisButtonBase first={first} selected stylesheet={stylesheet} label="" />;
  }
}

export function QueryVisNavigateButton(
  props: {
    query: NavigateQuery,
    selected: ?QueryAtom,
    children?: React$Element<*>,
  },
) {
  let {query, ...rest} = props;
  return (
    <QueryVisButton
      {...rest}
      selectable
      closeable
      stylesheet={{Root: QueryPane.NavigatePane, Button: QueryButton.NavigateButton}}
      query={query}
      label={query.context.title || query.path}
    />
  );
}

export function QueryVisDefineButton(
  props: {
    query: DefineQuery,
    selected: ?QueryAtom,
    activeQueryPipeline: ?QueryPipeline,
    first?: boolean,
  },
) {
  let {query, selected, activeQueryPipeline, first} = props;
  let isSelected = selected && selected.id === query.id;
  return (
    <VBox paddingBottom={5} left={1}>
      <VBox
        borderLeft={css.border(1, '#bbb')}
        borderTop={css.border(1, '#bbb')}
        borderBottom={css.border(1, '#bbb')}
        overflow="visible">
        <QueryVisDefineHeader
          selectable
          closeable
          closeTitle="Remove"
          selected={isSelected}
          label={query.context.title || query.binding.name}
          query={query}
        />
        <VBox paddingLeft={8}>
          <QueryVisPipeline
            pipeline={query.binding.query}
            selected={selected}
            activeQueryPipeline={activeQueryPipeline}
          />
        </VBox>
      </VBox>
      <ArrowDown left={5} bottom={0} color="#bbb" />
      <ArrowDown left={5} bottom={1} color="white" />
      {!first && [
        <ArrowDown key="1" left={5} top={0} color="#bbb" />,
        <ArrowDown key="2" left={5} top={-1} color="white" />,
      ]}
    </VBox>
  );
}

export function QueryVisFilterButton(
  props: {
    query: FilterQuery,
    selected: ?QueryAtom,
  },
) {
  let {query} = props;
  let stylesheet = {
    Root: QueryPane.FilterPane,
    Button: QueryButton.FilterButton,
  };
  return (
    <QueryVisButton
      {...props}
      selectable
      closeable
      stylesheet={stylesheet}
      label={query.context.title}
    />
  );
}

export function QueryVisGroupButton(
  {
    query,
    ...rest
  }: {
    query: GroupQuery,
    selected: ?QueryAtom,
  },
) {
  return (
    <QueryVisButton
      {...rest}
      selectable
      closeable
      stylesheet={{Root: QueryPane.GroupPane, Button: QueryButton.GroupButton}}
      query={query}
      label={query.context.title}
    />
  );
}

export function QueryVisAggregateButton(
  {
    query,
    ...rest
  }: {
    query: AggregateQuery,
    selected: ?QueryAtom,
  },
) {
  return (
    <QueryVisButton
      {...rest}
      selectable
      closeable
      stylesheet={{Root: QueryPane.AggregatePane, Button: QueryButton.AggregateButton}}
      query={query}
      label={query.context.title}
    />
  );
}

class QueryVisDefineHeader extends React.Component {
  context: {
    actions: Actions,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  props: {
    label: string,
    query: DefineQuery,
    closeable?: boolean,
    closeTitle?: string,
    selected?: ?boolean,
    selectable?: boolean,
  };

  onRemove = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.cut({at: this.props.query.binding.query});
  };

  onSelect = (ev: UIEvent) => {
    ev.stopPropagation();
    this.context.actions.setSelected({query: this.props.query});
  };

  render() {
    const {
      label,
      selectable,
      selected,
      closeable,
      closeTitle,
    } = this.props;
    return (
      <HBox
        height={34}
        fontSize="10px"
        fontWeight={400}
        color="#888888"
        cursor="default"
        userSelect="none"
        borderLeft={css.border(3, 'transparent')}
        padding={{horizontal: 5, vertical: 5}}
        onClick={selectable && this.onSelect}>
        <HBox flexGrow={1} flexShrink={1} alignItems="center">
          <Element
            marginRight={10}
            minWidth={0}
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            textTransform={css.textTransform.uppercase}>
            {label}
          </Element>
        </HBox>
        <QueryButton.DefaultButton
          title="Configure query output"
          marginRight={2}
          active={selected}>
          <Icon.IconCogs />
        </QueryButton.DefaultButton>
        {closeable &&
          <HBox>
            <QueryButton.DefaultButton title={closeTitle} onClick={this.onRemove}>
              <Icon.IconRemove />
            </QueryButton.DefaultButton>
          </HBox>}
      </HBox>
    );
  }
}

function QueryVisQueryButton(
  props: {
    query: QueryAtom | QueryPipeline,
    selected: ?QueryAtom,
    activeQueryPipeline: ?QueryPipeline,
    first?: boolean,
    closeable?: boolean,
    isTopLevel?: boolean,
  },
) {
  const {query, ...rest} = props;
  if (query.name === 'here') {
    return <noscript />;
  } else if (query.name === 'navigate') {
    return <QueryVisNavigateButton {...rest} query={query} />;
  } else if (query.name === 'filter') {
    return <QueryVisFilterButton {...rest} query={query} />;
  } else if (query.name === 'pipeline') {
    return <QueryVisPipeline {...rest} pipeline={query} />;
  } else if (query.name === 'select') {
    return <noscript />;
  } else if (query.name === 'define') {
    return <QueryVisDefineButton {...rest} query={query} />;
  } else if (query.name === 'group') {
    return <QueryVisGroupButton {...rest} query={query} />;
  } else if (query.name === 'aggregate') {
    return <QueryVisAggregateButton {...rest} query={query} />;
  } else if (query.name === 'select') {
    return <noscript />;
  } else if (query.name === 'limit') {
    return <noscript />;
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

function QueryVisPipeline(
  {
    pipeline,
    closeable,
    isTopLevel,
    activeQueryPipeline,
    ...props
  }: {
    pipeline: QueryPipeline,
    selected: ?QueryAtom,
    activeQueryPipeline: ?QueryPipeline,
    closeable?: boolean,
    isTopLevel?: boolean,
  },
) {
  let items = [];
  let disableAdd = false;
  let first = pipeline.pipeline[0];
  pipeline.pipeline.forEach((query, idx) => {
    let firstItem = first.name === 'here' ? 1 : 0;
    items.push(
      <QueryVisPipelineItem key={idx} variant={{isTopLevel}}>
        <QueryVisQueryButton
          {...props}
          first={idx === firstItem}
          activeQueryPipeline={activeQueryPipeline}
          closeable={closeable && idx > 0}
          query={query}
        />
      </QueryVisPipelineItem>,
    );
  });
  if (activeQueryPipeline && activeQueryPipeline.id === pipeline.id) {
    disableAdd = true;
    items.push(
      <QueryVisPipelineItem key="__insertAfter__" variant={{isTopLevel}}>
        <QueryVisInsertAfterButton first={isTopLevel} query={pipeline} />
      </QueryVisPipelineItem>,
    );
  }
  return (
    <QueryVisPipelineRoot paddingLeft={isTopLevel ? 8 : 0}>
      {items}
      {!isTopLevel &&
        <VBox marginTop={10}>
          <QueryVisToolbar disableAdd={disableAdd} pipeline={pipeline} />
        </VBox>}
    </QueryVisPipelineRoot>
  );
}

let QueryVisPipelineRoot = style(VBox, {
  displayName: 'QueryVisPipelineRoot',
  base: {},
});

let QueryVisPipelineItem = style(VBox, {
  displayName: 'QueryVisPipelineItem',
  base: {
    marginBottom: 0,
    lastOfType: {
      marginBottom: 0,
    },
  },
  isTopLevel: {
    marginBottom: 5,
    lastOfType: {
      marginBottom: 0,
    },
  },
});

type QueryVisProps = {
  pipeline: QueryPipeline,
  onShowSelect(): *,
  selected: ?QueryAtom,
  activeQueryPipeline: ?QueryPipeline,
};

/**
 * Render graphical query representation.
 */
export class QueryVis extends React.Component<*, QueryVisProps, *> {
  render() {
    let {pipeline, selected, activeQueryPipeline} = this.props;
    return (
      <VBox flexGrow={1}>
        <QueryVisQueryButton
          isTopLevel
          selected={selected}
          activeQueryPipeline={activeQueryPipeline}
          query={pipeline}
        />
      </VBox>
    );
  }

  onShowSelect = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onShowSelect();
  };
}
