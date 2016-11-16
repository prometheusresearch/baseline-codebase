/**
 * @flow
 */

import type {QueryPipeline, QueryPointer, Context, Type} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as t from '../model/Type';
import {MenuHelp, MenuGroup, MenuButton} from './menu';

type Navigation = {
  type: 'entity' | 'attribute' | 'query';
  value: string;
  label: string;
  context: Context;
  pointer?: QueryPointer<>;
  groupBy?: boolean;
};

export default class AddNavigateMenu extends React.Component {

  context: {
    actions: Actions;
  };

  props: {
    pointer: QueryPointer<>;
  };

  state: {
    searchTerm: ?string;
  } = {
    searchTerm: null,
  };

  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onSearchTerm = (e: UIEvent) => {
    let target: {value: string} = (e.target: any);
    this.setState({searchTerm: target.value === '' ? null : target.value});
  };

  onSelect = (payload: {
    path: string;
  }) => {
    let pointer = this.props.pointer;
    this.context.actions.appendNavigate({
      pointer: pointer,
      path: [payload.path],
    });
  };

  render() {
    let {
      pointer,
    } = this.props;
    let {
      searchTerm,
    } = this.state;

    let pipeline: QueryPointer<QueryPipeline> = (qp.prev(pointer): any);

    let type = getEffectivePipelineType(pipeline.query);

    if (type.name === 'invalid') {
      return <NoNavigateMenu />;
    }

    if (type.name !== 'record') {
      return <NoNavigateMenu />;
    }

    let entityList = [];
    let attributeList = [];

    getNavigation(pointer, type).forEach(item => {
      let button = (
        <NavigateButton
          key={item.value}
          label={item.label}
          path={item.value}
          onClick={this.onSelect}
          />
      );
      if (item.type === 'attribute') {
        attributeList.push(button);
      } else {
        entityList.push(button);
      }
    });

    if (searchTerm != null) {
      let searchTermRe = new RegExp(searchTerm, 'ig');
      let filter = item => {
        let matches = (
          searchTermRe.test(item.props.label) ||
          searchTermRe.test(item.props.path)
        );
        return matches;
      };
      entityList = entityList.filter(filter);
      attributeList = attributeList.filter(filter);
    }

    return (
      <VBox>
        <VBox padding={10}>
          <ReactUI.Input
            placeholder="Search…"
            value={searchTerm === null ? '' : searchTerm}
            onChange={this.onSearchTerm}
            />
        </VBox>
        {entityList.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup
              title={
                type.name === 'invalid' || type.name === 'void'
                  ? 'Entities'
                  : 'Relationships'
              }>
              {entityList}
            </MenuGroup>
          </VBox>}
        {attributeList.length > 0 &&
          <VBox paddingBottom={10}>
            <MenuGroup title="Attributes">
              {attributeList}
            </MenuGroup>
          </VBox>}
      </VBox>
    );
  }
}

function NoNavigateMenu({title = 'Focus'}) {
  return (
    <MenuGroup title={title}>
      <MenuHelp>
        Currently selected query has no attributes or relationships to navigate
        to.
      </MenuHelp>
    </MenuGroup>
  );
}

class NavigateButton extends React.Component {

  props: {
    path: string;
    label: string;
    onClick: (payload: {
      path: string;
    }) => *;
  };

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    let {onClick, path} = this.props;
    onClick({path});
  };

  render() {
    let {label, path} = this.props;
    return (
      <MenuButton
        icon="＋"
        onClick={this.onClick}>
        <div>
          {label || path}
        </div>
      </MenuButton>
    );
  }
}

function getEffectivePipelineType(query: q.QueryPipeline): t.Type {
  if (query.pipeline.length === 1) {
    return query.context.type;
  }

  let last = query.pipeline[query.pipeline.length - 1];

  if (last.name === 'select') {
    return query.pipeline[query.pipeline.length - 2].context.type;
  } else {
    return query.context.type;
  }
}

function getNavigation(
  pointer: QueryPointer<>,
  type: Type
): Array<Navigation> {
  let {context} = pointer.query;
  let {scope, domain} = context;
  let navigation = [];

  let contextAtQuery = {
    ...context,
    type: t.regType(type),
  };

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
        navigation.push({
          type: 'entity',
          value: k,
          label: domain.entity[k].title,
          context: navQuery.context,
        });
      }
    }
  } else if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(contextAtQuery, q.navigate(k));
        let type = attribute[k].type;
        navigation.push({
          type: type.card === 'seq'
            ? 'entity'
            : type.name === 'record'
            ? 'query'
            : 'attribute',
          value: k,
          label: attribute[k].title || k,
          context: navQuery.context,
          groupBy: attribute[k].groupBy,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(contextAtQuery, scope[k].query);
      navigation.push({
        type: 'query',
        value: k,
        label: k,
        context: navQuery.context,
      });
    }
  }

  return navigation;
}
