/**
 * @flow
 */

import type {Query, Domain} from './model/Query';
import type {QueryPointer} from './model/QueryPointer';

import invariant from 'invariant';
import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import ArrowLeftIcon  from 'react-icons/lib/fa/arrow-left';

import {fetch} from './fetch';
import * as t from './model/Type';
import * as q from './model/Query';
import * as qp from './model/QueryPointer';
import * as qo from './model/QueryOperation';
import * as ui from './ui';

function getInitialQuery(domain: Domain): Query {
  let entityName = Object.keys(domain.entity)[0];
  invariant(entityName != null, 'Empty domain');
  return q.navigate(entityName);
}

function guessNavigatePath(query: Query): ?string {
  let {type, domain} = query.context;
  if (type == null) {
    return null;
  }
  type = t.atom(type);
  if (type.name === 'entity') {
    let attributeName = Object.keys(domain.entity[type.entity].attribute)[0];
    if (attributeName == null) {
      return null;
    }
    return attributeName;
  } else {
    return null;
  }
}

type QueryBuilderProps = {
  domain: Domain;
  api: string;
  initialQuery: ?Query;
};

type QueryBuilderState = {
  query: Query;
  queryInvalid: boolean;
  fieldList: Array<string>;
  selected: ?QueryPointer<Query>;
  data: ?Object;
  dataUpdating: boolean;
  showAddColumnPanel: boolean;
};

export type QueryBuilderActions = {
  addNavigate(pointer: QueryPointer<Query>): void;
  addDefine(pointer: QueryPointer<Query>): void;
  addFilter(pointer: QueryPointer<Query>): void;
  addAggregate(pointer: QueryPointer<Query>): void;
  remove(pointer: QueryPointer<Query>): void;
  select(pointer: ?QueryPointer<Query>): void;
  replace(pointer: QueryPointer<Query>, query: Query): void;
};

export default class QueryBuilder extends React.Component {

  state: QueryBuilderState;
  props: QueryBuilderProps;
  actions: QueryBuilderActions;

  static childContextTypes = {
    actions: React.PropTypes.object,
  };

  constructor(props: QueryBuilderProps) {
    super(props);
    let {domain, initialQuery} = props;
    let query = q.inferType(domain, initialQuery || getInitialQuery(domain));
    let fieldList = getFieldList(query);
    let selected = qp.select(qp.make(query), ['pipeline', 0]);

    this.actions = {
      addNavigate: this.addNavigateAction,
      addDefine: this.addDefineAction,
      addFilter: this.addFilterAction,
      addAggregate: this.addAggregateAction,
      remove: this.removeAction,
      select: this.selectAction,
      replace: this.replaceAction,
    };

    this.state = {
      query,
      queryInvalid: false,
      fieldList,
      selected,
      data: null,
      dataUpdating: false,
      showAddColumnPanel: false,
    };
  }

  selectAction = (pointer: ?QueryPointer<*>) => {
    this.onSelect(pointer);
  };

  removeAction = (pointer: QueryPointer<*>) => {
    let {query, selected: nextSelected} = qo.removeAt(
      pointer,
      this.state.selected
    );
    this.onQuery(query, nextSelected);
  };

  replaceAction = (pointer: QueryPointer<*>, query: Query) => {
    let {query: nextQuery, selected} = qo.transformAt(
      pointer,
      pointer,
      prevQuery => query
    );
    this.onQuery(nextQuery, selected);
  };

  addNavigateAction = (pointer: QueryPointer<*>) => {
    let path = guessNavigatePath(pointer.query);
    if (path == null) {
      return;
    }
    let {query, selected: nextSelected} = qo.insertAfter(
      pointer,
      this.state.selected,
      q.navigate(path)
    );
    this.onQuery(query, nextSelected);
  };

  addDefineAction = (pointer: QueryPointer<*>) => {
    let path = guessNavigatePath(pointer.query);
    if (path == null) {
      return;
    }
    let {query, selected: nextSelected} = qo.insertAfter(
      pointer,
      this.state.selected,
      q.def(`define_${path}`, q.navigate(path))
    );
    this.onQuery(query, nextSelected);
  };

  addFilterAction = (pointer: QueryPointer<*>) => {
    let {
      query,
      selected: nextSelected
    } = qo.insertAfter(
      pointer,
      this.state.selected,
      q.filter(q.navigate('true'))
    );
    this.onQuery(query, nextSelected);
  };

  addAggregateAction = (pointer: QueryPointer<*>) => {
    let {query, selected: nextSelected} = qo.insertAfter(
      pointer,
      this.state.selected,
      q.aggregate('count')
    );
    this.onQuery(query, nextSelected);
  };

  onSelect = (selected: ?QueryPointer<Query>) => {
    this.setState(state => {
      return {...state, selected, showAddColumnPanel: false};
    });
  }

  onQuery = (query: ?Query, selected: ?QueryPointer<*>) => {
    if (query == null) {
      query = q.navigate('');
      selected = qp.make(query);
    }

    let nextQuery = q.inferType(this.props.domain, query);
    let fieldList = updateFieldList(nextQuery, this.state.fieldList);
    let nextSelected = null;
    if (selected) {
      nextSelected = qp.rebase(selected, nextQuery);
    }
    this.setState({
      query: nextQuery,
      selected: nextSelected,
      fieldList: fieldList,
      showAddColumnPanel: false,
    });
    this.fetchData(selectAll(nextQuery, fieldList));
  };

  onShowAddColumn = () => {
    this.setState({
      showAddColumnPanel: true,
      selected: null,
    });
  };

  onAddColumnPanelClose = () => {
    this.setState({showAddColumnPanel: false});
  };

  onFieldList = ({fieldList, close}: {fieldList: Array<string>; close: boolean}) => {
    this.setState(state => {
      return {
        ...state,
        fieldList,
        showAddColumnPanel: close ? false : state.showAddColumnPanel,
      };
    }, () => {
      this.fetchData(selectAll(this.state.query, this.state.fieldList));
    });
  };

  render() {
    let {
      query,
      queryInvalid,
      fieldList,
      selected,
      data,
      dataUpdating,
      showAddColumnPanel
    } = this.state;

    let pointer = qp.make(query);

    return (
      <HBox grow={1} height="100%">
        <VBox basis="300px" overflow="auto">
          <ui.QueryVis
            domain={this.props.domain}
            pointer={pointer}
            selected={selected}
            showAddColumnPanel={showAddColumnPanel}
            onAddColumn={this.onShowAddColumn}
            />
        </VBox>
        {(selected || showAddColumnPanel) &&
          <VBox basis="200px" grow={1}>
            {showAddColumnPanel ?
              <ui.AddColumnPanel
                fieldList={fieldList}
                onFieldList={this.onFieldList}
                pointer={pointer}
                onClose={this.onAddColumnPanelClose}
                /> :
              <ui.QueryPanel
                onClose={this.onSelect.bind(null, null)}
                pointer={selected}
                />}
          </VBox>}
        <VBox basis="400px" grow={3} style={{borderLeft: css.border(1, '#ccc')}}>
          {!dataUpdating && !queryInvalid
            ? <ui.DataTable
                fieldList={fieldList}
                onAddColumn={this.onShowAddColumn}
                query={selectAll(query, fieldList)}
                data={data}
                />
            : queryInvalid
            ? <InvalidQueryMessage />
            : null}
        </VBox>
      </HBox>
    );
  }

  getChildContext() {
    return {actions: this.actions};
  }

  fetchData(query: Query) {
    if (query.context.type == null) {
      this.setState({dataUpdating: false, queryInvalid: true});
    } else {
      this.setState({dataUpdating: true, queryInvalid: false});
      fetch(this.props.api, query)
        .then(data => {
          this.setState({data, dataUpdating: false});
        });
    }
  }

  componentDidMount() {
    this.fetchData(selectAll(this.state.query, this.state.fieldList));
  }
}

function getFieldList(query) {
  let fieldList = [];
  let {type, domain, scope} = query.context;
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          fieldList.push(k);
        }
      }
    } else if (type.name === 'text') {
      fieldList.push('0');
    } else if (type.name === 'number') {
      fieldList.push('0');
    }
  }
  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      fieldList.push(k);
    }
  }
  return fieldList;
}

function updateFieldList(query, fieldList) {
  let allFieldList = getFieldList(query);
  let nextFieldList = fieldList.filter(field => {
    return allFieldList.indexOf(field) > -1;
  });
  // TODO: think of the better heueristics for preserving prev fieldList
  return nextFieldList.length < 2 ? allFieldList : nextFieldList;
}

function selectAll(query: Query, fieldList: Array<string> = []) {
  let {domain, type, scope} = query.context;
  let fields = {};
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (
          attribute.hasOwnProperty(k) &&
          fieldList.indexOf(k) > -1
        ) {
          fields[k] = q.navigate(k);
        }
      }
    }
  }
  for (let k in scope) {
    if (scope.hasOwnProperty(k) && fieldList.indexOf(k) > -1) {
      fields[k] = q.navigate(k);
    }
  }
  if (Object.keys(fields).length > 0) {
    query = qo.insertAfter(qp.make(query), null, q.select(fields)).query;
    query = q.inferType(domain, query);
  }
  return query;
}

function InvalidQueryMessage() {
  return (
    <ui.Message>
      Query is invalid. You need to either fix it or
      <VBox padding={5}>
        <ReactUI.Button
          icon={<ArrowLeftIcon />}
          size="small">
          return back
        </ReactUI.Button>
      </VBox>
      to the previous state.
    </ui.Message>
  );
}