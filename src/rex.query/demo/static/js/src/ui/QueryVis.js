/**
 * @flow
 */

import type {Query, Context} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style} from 'react-dom-stylesheet';
import IconPlus from 'react-icons/lib/fa/plus';
import IconRemove from 'react-icons/lib/fa/trash';
import IconCube from 'react-icons/lib/fa/cube';
import IconFilter from 'react-icons/lib/fa/filter';
import IconPointer from 'react-icons/lib/fa/mouse-pointer';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'

import invariant from 'invariant';
import color from 'color';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import * as theme from './Theme';

function noop() {}

let ColumnLabelRoot = style(HBox, {
  userSelect: 'none',
  cursor: 'default',
  fontSize: '8pt',

  em: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
}, {displayName: 'ColumnLabelRoot'});

export function ColumnLabel(props: Object) {
  return (
    <ColumnLabelRoot
      variant={{em: true}}
      width="100%"
      paddingH={5}
      paddingV={5}
      {...props}
      />
  );
}

function createButton(displayName, theme) {
  let Root = style(HBox, {

    backgroundColor: theme.background,
    color: theme.color,
    borderRadius: 2,

    justifyContent: 'center',
    userSelect: 'none',
    cursor: 'default',
    fontSize: '10px',
    alignItems: 'center',

    hover: {
      color: color(theme.color).darken(0.1).rgbString(),
      backgroundColor: color(theme.background).lighten(0.05).rgbString(),
    },

    enableActive: {
      active: {
        color: theme.background,
        backgroundColor: theme.color,
      },
    }

  }, {displayName: `${displayName}Root`});

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
    backgroundColor: theme.background,
    color: theme.color,
  }, {displayName});
}

let NavigateButton = createButton('NavigateButton', theme.entity);
let AggregateButton = createButton('AggregateButton', theme.aggregate);
let DefineButton = createButton('AggregateButton', theme.traverse);
let FilterButton = createButton('FilterButton', theme.filter);

let NavigatePanel = createPanel('NavigatePanel', theme.entity);
let AggregatePanel = createPanel('AggregatePanel', theme.aggregate);
let DefinePanel = createPanel('AggregatePanel', theme.traverse);
let FilterPanel = createPanel('FilterPanel', theme.filter);

type onSelectCallback = (selected: ?QueryPointer<Query>) => *;

type QueryButtonProps = {
  label: string;
  pointer: QueryPointer<>;
  children?: React$Element<*>;
  innerChildren?: React$Element<*>;
  style: Object;
  selected: QueryPointer<>;
  onSelect: onSelectCallback;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  stylesheet: {
    Root: typeof VBox;
    Button: typeof VBox;
  };
};

class QueryButton extends React.Component<*, QueryButtonProps, *> {

  state: {
    isActive: boolean;
    isHover: boolean;
  };

  static defaultProps = {
    selected: false,
    onSelect: noop,
    stylesheet: {
      Root: VBox,
      Button: VBox,
    }
  };

  onSelect = (e) => {
    e.stopPropagation();
    let {selected, onSelect, pointer} = this.props;
    let isSelected = qp.is(selected, pointer);
    if (isSelected) {
      onSelect(null);
    } else {
      onSelect(pointer);
    }
  };

  onRemove = (e) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.removeAt(pointer, selected);
    onQuery(query, nextSelected);
  };

  onAddFilter = (e) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.filter(q.navigate('true')));
    onQuery(query, nextSelected);
  };

  onAddNavigate = (e) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.navigate('code'));
    onQuery(query, nextSelected);
  };

  onAddAggregate = (e) => {
    e.stopPropagation();
    let {pointer, onQuery, selected} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.aggregate('count'));
    onQuery(query, nextSelected);
  };

  onAddDefine = (e) => {
    e.stopPropagation();
    let {pointer, onQuery, selected} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.def('name', q.navigate('code')));
    onQuery(query, nextSelected);
  };

  toggleActive = (e) => {
    e.stopPropagation();
    let isActive = !this.state.isActive;
    this.setState({isActive});
  };

  onMouseEnter = () => {
    this.setState({isHover: true});
  };

  onMouseLeave = () => {
    this.setState({isHover: false});
  };

  constructor(props) {
    super(props);
    this.state = {
      isActive: true,
      isHover: false,
    };
  }

  render() {
    let {
      label, children, selected, pointer, innerChildren,
      stylesheet: {Root, Button},
    } = this.props;
    let {
      isActive, isHover
    } = this.state;
    let isSelected = qp.is(selected, pointer);
    let canNavigate = canNavigateAt(pointer.query.context);
    let canFilter = canFilterAt(pointer.query.context);
    let canDefine = canDefineAt(pointer.query.context);
    let canAggregate = canAggregateAt(pointer.query.context);
    return (
      <Root>
        <VBox
          onClick={this.onSelect}
          onMouseOver={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}>
          <ColumnLabel>
            <HBox grow={1} alignItems="center">
              <VBox
                paddingRight={5}
                style={{visibility: !isActive || isSelected || isHover ? 'visible' : 'hidden'}}>
                <Button disableActive onClick={this.toggleActive}>
                  {isActive ? <IconCircle /> : <IconCircleO />}
                </Button>
              </VBox>
              <VBox grow={1}>{label}</VBox>
              <HBox style={{visibility: isSelected || isHover ? 'visible' : 'hidden'}}>
                <Button onClick={this.onRemove}>
                  <IconRemove />
                </Button>
              </HBox>
            </HBox>
          </ColumnLabel>
          {isSelected &&
            <Root
              position="absolute"
              top={0}
              right={-6}
              width={6}
              height="100%"
              />}
        </VBox>
        {innerChildren &&
          <VBox marginLeft={10} style={{backgroundColor: 'white'}}>
            <VBox paddingLeft={4} paddingTop={4}>{innerChildren}</VBox>
          </VBox>}
        {isSelected && (canAggregate || canFilter || canNavigate || canDefine) &&
          <VBox width="100%" style={{backgroundColor: 'white'}} padding={5} paddingBottom={0}>
            <HBox>
              <HBox width="25%">
                {canNavigate &&
                  <ReactUI.QuietButton size="x-small" width="100%" onClick={this.onAddNavigate} icon={<IconPointer />}>
                    Navigate
                  </ReactUI.QuietButton>}
              </HBox>
              <HBox width="25%">
                {canFilter &&
                  <ReactUI.QuietButton size="x-small" width="100%" onClick={this.onAddFilter} icon={<IconFilter />}>
                    Filter
                  </ReactUI.QuietButton>}
              </HBox>
              <HBox width="25%">
                {canDefine &&
                  <ReactUI.QuietButton size="x-small" width="100%" onClick={this.onAddDefine} icon={<IconPlus />}>
                    Define
                  </ReactUI.QuietButton>}
              </HBox>
              <HBox width="25%">
                {canAggregate &&
                  <ReactUI.QuietButton size="x-small" width="100%" onClick={this.onAddAggregate} icon={<IconCube />}>
                    Aggregate
                  </ReactUI.QuietButton>}
              </HBox>
            </HBox>
          </VBox>}
        {children}
      </Root>
    );
  }

}

type NavigateProps = {
  pointer: QueryPointer<q.NavigateQuery>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  onSelect: onSelectCallback;
  children?: React$Element<*>;
};

export class Navigate extends React.Component<*, NavigateProps, *> {

  render() {
    let {pointer, children, ...props} = this.props;
    children = React.Children.map(children, child =>
      child && <VBox paddingTop={4}>{child}</VBox>);
    return (
      <QueryButton
        {...props}
        stylesheet={{Root: NavigatePanel, Button: NavigateButton}}
        pointer={pointer}
        label={pointer.query.path}>
        <VBox style={{backgroundColor: 'white'}}>
          {children}
        </VBox>
      </QueryButton>
    );
  }
}

type DefineProps = {
  binding: React$Element<*>;
  pointer: QueryPointer<q.DefineQuery>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  onSelect: onSelectCallback;
  children?: React$Element<*>;
};

export class Define extends React.Component<*, DefineProps, *> {

  render() {
    let {pointer, binding, children, ...props} = this.props;
    return (
      <QueryButton
        {...props}
        stylesheet={{Root: DefinePanel, Button: DefineButton}}
        pointer={pointer}
        label={`Define: ${pointer.query.binding.name}`}
        innerChildren={binding}>
        <VBox style={{backgroundColor: 'white'}}>
          {React.Children.map(children, child => {
            return child && <VBox paddingTop={4}>{child}</VBox>;
          })}
        </VBox>
      </QueryButton>
    );
  }
}

type FilterProps = {
  pointer: QueryPointer<q.FilterQuery>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  children?: React$Element<*>;
  onSelect: onSelectCallback;
};

export class Filter extends React.Component<*, FilterProps, *> {

  render() {
    let {pointer, children, ...props} = this.props;
    children = React.Children.map(children, child =>
      child && <VBox paddingTop={4}>{child}</VBox>);
    return (
      <QueryButton
        {...props}
        stylesheet={{Root: FilterPanel, Button: FilterButton}}
        pointer={pointer}
        label="Filter">
        <VBox style={{backgroundColor: 'white'}}>
          {children}
        </VBox>
      </QueryButton>
    );
  }
}

type AggregateProps = {
  pointer: QueryPointer<q.AggregateQuery>;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  children?: React$Element<*>;
  onSelect: onSelectCallback;
};

export class Aggregate extends React.Component<*, AggregateProps, *> {

  render() {
    let {pointer, children, ...props} = this.props;
    children = React.Children.map(children, child =>
      child && <VBox paddingTop={4}>{child}</VBox>);
    return (
      <QueryButton
        {...props}
        stylesheet={{Root: AggregatePanel, Button: AggregateButton}}
        pointer={pointer}
        label={pointer.query.aggregate}>
        <VBox style={{backgroundColor: 'white'}}>
          {children}
        </VBox>
      </QueryButton>
    );
  }
}

type QueryPipelineProps = {
  pipeline: Array<QueryPointer<Query>>;
  onSelect: onSelectCallback;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  selected: ?QueryPointer<Query>;
};

function QueryPipelineVis(props: QueryPipelineProps) {
  let {pipeline, onQuery, onSelect, selected} = props;
  let [pointer, ...rest] = pipeline;
  let {query} = pointer;
  switch (query.name) {
    case 'pipeline':
      return QueryPipelineVis({
        ...props,
        pipeline: qp.spread(pointer),
      });
    case 'navigate':
      return (
        <Navigate
          selected={selected}
          onSelect={onSelect}
          onQuery={onQuery}
          pointer={pointer}>
          {rest.length > 0 &&
            <QueryPipelineVis
              {...props}
              pipeline={rest}
              />}
        </Navigate>
      );
    case 'filter':
      return (
        <Filter
          selected={selected}
          onSelect={onSelect}
          onQuery={onQuery}
          pointer={pointer}>
          {rest.length > 0 &&
            <QueryPipelineVis
              {...props}
              pipeline={rest}
              />}
        </Filter>
      );
    case 'define': {
      let bindingPointer = qp.select(
        pointer,
        ['binding', 'query']
      );
      return (
        <Define
          selected={selected}
          onSelect={onSelect}
          onQuery={onQuery}
          pointer={pointer}
          name={query.binding.name}
          binding={
            <QueryPipelineVis
              {...props}
              pipeline={[bindingPointer]}
              />
            }>
          {rest.length > 0 &&
            <QueryPipelineVis
              {...props}
              pipeline={rest}
              />}
        </Define>
      );
    }
    case 'select': {
      return (
        rest.length > 0 ?
          <QueryPipelineVis
            {...props}
            pipeline={rest}
            /> :
         null
      );
    }
    case 'limit': {
      return (
        rest.length > 0 ?
          <QueryPipelineVis
            {...props}
            pipeline={rest}
            /> :
         null
      );
    }
    case 'aggregate': {
      return (
        <Aggregate
          selected={selected}
          onSelect={onSelect}
          onQuery={onQuery}
          pointer={pointer}>
          {rest.length > 0 &&
            <QueryPipelineVis
              {...props}
              pipeline={rest}
              />}
        </Aggregate>
      );
    }
    default:
      invariant(false, 'Unknown query type: %s', pointer.query.name);
  }
}

type QueryVisProps<Q: Query> = {
  pointer: QueryPointer<Q>;
  onSelect: onSelectCallback;
  onQuery: (query: ?Query, selected: ?QueryPointer<>) => *;
  selected: ?QueryPointer<Query>;
};

/**
 * Render graphical query representation.
 */
export class QueryVis extends React.Component<*, QueryVisProps<*>, *> {

  render() {
    let {pointer, selected, ...restProps} = this.props;
    return (
      <VBox height="100%" onClick={this.onRemoveSelection}>
        <QueryPipelineVis
          {...restProps}
          selected={selected}
          pipeline={qp.spread(pointer)}
          />
        {!selected &&
          <HBox padding={5}>
            <VBox width="25%">
              {canNavigateAt(pointer.query.context) &&
                <ReactUI.QuietButton
                  size="x-small"
                  icon={<IconPointer />}
                  onClick={this.onAddNavigate}>
                  Navigate
                </ReactUI.QuietButton>}
            </VBox>
            <VBox width="25%">
              {canFilterAt(pointer.query.context) &&
                <ReactUI.QuietButton
                  size="x-small"
                  icon={<IconFilter />}
                  onClick={this.onAddFilter}>
                  Filter
                </ReactUI.QuietButton>}
            </VBox>
            <VBox width="25%">
              {canDefineAt(pointer.query.context) &&
                <ReactUI.QuietButton
                  size="x-small"
                  icon={<IconPlus />}
                  onClick={this.onAddDefine}>
                  Define
                </ReactUI.QuietButton>}
            </VBox>
            <VBox width="25%">
              {canAggregateAt(pointer.query.context) &&
                <ReactUI.QuietButton
                  size="x-small"
                  icon={<IconCube />}
                  onClick={this.onAddAggregate}>
                  Aggregate
                </ReactUI.QuietButton>}
            </VBox>
          </HBox>}
      </VBox>
    );
  }

  onRemoveSelection = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onSelect(null);
  };

  onAddNavigate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.navigate('code'));
    onQuery(query, nextSelected);
  };

  onAddDefine = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.def('name', q.navigate('code')));
    onQuery(query, nextSelected);
  };

  onAddFilter = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.filter(q.navigate('true')));
    onQuery(query, nextSelected);
  };

  onAddAggregate = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.insertAfter(pointer, selected, q.aggregate('count'));
    onQuery(query, nextSelected);
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
