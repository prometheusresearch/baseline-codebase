/**
 * @flow
 */

import type {Query, Domain, DefineQuery} from './model/Query';
import type {QueryPointer} from './model/QueryPointer';

import invariant from 'invariant';
import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import ArrowLeftIcon  from 'react-icons/lib/fa/arrow-left';
import ArrowRightIcon  from 'react-icons/lib/fa/arrow-right';
import DownloadIcon from 'react-icons/lib/fa/cloud-download';

import {fetch, initiateDownload} from './fetch';
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
  undoStack: Array<{
    query: Query;
    selected: ?QueryPointer<Query>;
    fieldList: Array<string>;
  }>;
  redoStack: Array<{
    query: Query;
    selected: ?QueryPointer<Query>;
    fieldList: Array<string>;
  }>;
};

export type QueryBuilderActions = {
  addNavigate(pointer: QueryPointer<Query>): void;
  addDefine(pointer: QueryPointer<Query>): void;
  addFilter(pointer: QueryPointer<Query>): void;
  addAggregate(pointer: QueryPointer<Query>): void;
  remove(pointer: QueryPointer<Query>): void;
  select(pointer: ?QueryPointer<Query>): void;
  replace(pointer: QueryPointer<Query>, query: Query): void;
  renameDefineBinding(pointer: QueryPointer<DefineQuery>, name: string): void;
  undo(): void;
  redo(): void;
  export(): void;
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
      renameDefineBinding: this.renameDefineBindingAction,
      undo: this.undoAction,
      redo: this.redoAction,
      export: this.exportAction,
    };

    this.state = {
      query,
      queryInvalid: false,
      fieldList,
      selected,
      data: null,
      dataUpdating: false,
      showAddColumnPanel: false,
      undoStack: [],
      redoStack: [],
    };
  }

  exportAction = () => {
    initiateDownload(this.props.api, this.state.query);
  };

  undoAction = () => {
    let undoStack = this.state.undoStack.slice(0);
    let {query, selected, fieldList} = undoStack.pop();
    let redoStack = this.state.redoStack.concat({
      query: this.state.query,
      selected: this.state.selected,
      fieldList: this.state.fieldList,
    });
    this.setState({query, selected, fieldList, undoStack, redoStack});
    this.fetchData(selectAll(query, fieldList));
  };

  redoAction = () => {
    let redoStack = this.state.redoStack.slice(0);
    let {query, selected, fieldList} = redoStack.pop();
    let undoStack = this.state.undoStack.concat({
      query: this.state.query,
      selected: this.state.selected,
      fieldList: this.state.fieldList,
    });
    this.setState({query, selected, fieldList, undoStack, redoStack});
    this.fetchData(selectAll(query, fieldList));
  };

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
    let name = `define_${path}`;
    let {query, selected: nextSelected} = qo.insertAfter(
      pointer,
      this.state.selected,
      q.def(`define_${path}`, q.navigate(path))
    );
    let fieldList = this.state.fieldList.concat(name);
    this.onQuery(query, nextSelected, fieldList);
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

  renameDefineBindingAction = (pointer: QueryPointer<DefineQuery>, name: string) => {
    let {query: nextQuery, selected} = qo.transformAt(
      pointer,
      pointer,
      prevQuery => q.def(name, pointer.query.binding.query)
    );
    let fieldList = this.state.fieldList.map(field =>
      field === pointer.query.binding.name ? name : field);
    this.onQuery(nextQuery, selected, fieldList);
  };

  onSelect = (selected: ?QueryPointer<Query>) => {
    this.setState(state => {
      return {...state, selected, showAddColumnPanel: false};
    });
  }

  onQuery = (query: ?Query, selected: ?QueryPointer<*>, fieldList?: Array<string>) => {
    if (query == null) {
      query = q.navigate('');
      selected = qp.make(query);
    }

    let nextQuery = q.inferType(this.props.domain, query);
    fieldList = updateFieldList(nextQuery, fieldList || this.state.fieldList);
    let nextSelected = null;
    if (selected) {
      nextSelected = qp.rebase(selected, nextQuery);
    }
    this.setState({
      query: nextQuery,
      selected: nextSelected,
      fieldList: fieldList,
      showAddColumnPanel: false,
      undoStack: this.state.undoStack.concat({
        query: this.state.query,
        selected: this.state.selected,
        fieldList: this.state.fieldList,
      }),
      redoStack: [],
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
      <VBox height="100%">
        <QueryBuilderToolbar width="100%" padding={5} height={35}>
          <ReactUI.QuietButton
            disabled={this.state.undoStack.length < 1}
            onClick={this.actions.undo}
            icon={<ArrowLeftIcon />}
            size="small"
            groupHorizontally>
            Undo
          </ReactUI.QuietButton>
          <ReactUI.QuietButton
            disabled={this.state.redoStack.length < 1}
            onClick={this.actions.redo}
            iconAlt={<ArrowRightIcon />}
            size="small"
            groupHorizontally>
            Redo
          </ReactUI.QuietButton>
          <HBox marginLeft="auto">
            <ReactUI.QuietButton
              onClick={this.actions.export}
              icon={<DownloadIcon />}
              size="small">
              Export as .csv
            </ReactUI.QuietButton>
          </HBox>
        </QueryBuilderToolbar>
        <HBox grow={1}>
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
            {data != null && !queryInvalid
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
      </VBox>
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

let QueryBuilderToolbar = style(HBox, {
  base: {
    zIndex: 1,
    boxShadow: css.boxShadow(0, 1, 1, 1, '#ddd'),
  }
});
