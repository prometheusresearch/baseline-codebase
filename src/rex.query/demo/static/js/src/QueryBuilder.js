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
import TerminalIcon from 'react-icons/lib/fa/terminal';
import CogIcon from 'react-icons/lib/fa/cog';

import {fetch, initiateDownload} from './fetch';
import * as t from './model/Type';
import * as q from './model/Query';
import * as qp from './model/QueryPointer';
import * as qo from './model/QueryOperation';
import * as ui from './ui';
import * as parsing from './parsing';

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
  onQuery: (query: Query) => *;
};

type QueryBuilderState = {
  query: ?Query;
  queryInvalid: boolean;
  fieldList: Array<string>;
  selected: ?QueryPointer<Query>;
  data: ?Object;
  dataUpdating: boolean;
  showAddColumnPanel: boolean;
  showConsole: boolean;
  undoStack: Array<{
    query: ?Query;
    selected: ?QueryPointer<Query>;
    fieldList: Array<string>;
  }>;
  redoStack: Array<{
    query: ?Query;
    selected: ?QueryPointer<Query>;
    fieldList: Array<string>;
  }>;
};

export type QueryBuilderActions = {
  appendNavigate(pointer: ?QueryPointer<Query>): void;
  prependNavigate(pointer: ?QueryPointer<Query>): void;
  appendDefine(pointer: ?QueryPointer<Query>): void;
  prependDefine(pointer: ?QueryPointer<Query>): void;
  appendFilter(pointer: ?QueryPointer<Query>): void;
  prependFilter(pointer: ?QueryPointer<Query>): void;
  appendAggregate(pointer: ?QueryPointer<Query>): void;
  prependAggregate(pointer: ?QueryPointer<Query>): void;
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
      appendNavigate: this.appendNavigateAction,
      prependNavigate: this.prependNavigateAction,
      appendDefine: this.appendDefineAction,
      prependDefine: this.prependDefineAction,
      appendFilter: this.appendFilterAction,
      prependFilter: this.prependFilterAction,
      appendAggregate: this.appendAggregateAction,
      prependAggregate: this.prependAggregateAction,
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
      showConsole: false,
      undoStack: [],
      redoStack: [],
    };
  }

  exportAction = () => {
    if (this.state.query != null) {
      initiateDownload(
        this.props.api,
        addSelect(this.state.query, this.state.fieldList)
      );
    }
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
    if (query != null) {
      this.fetchData(addSelect(query, fieldList));
    }
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
    if (query != null) {
      this.fetchData(addSelect(query, fieldList));
    }
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

  appendNavigateAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        this.state.selected,
        q.navigate('')
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.navigate('');
      this.onQuery(query, qp.make(query));
    }
  };

  prependNavigateAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertBefore(
        pointer,
        this.state.selected,
        q.navigate('')
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.navigate('');
      this.onQuery(query, qp.make(query));
    }
  };

  appendDefineAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    // TODO: need to allocate unique name
    let name = 'Query';
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        this.state.selected,
        q.def(name, q.navigate(''))
      );
      nextSelected = qp.select(nextSelected, ['binding', 'query']);
      let fieldList = this.state.fieldList.concat(name);
      this.onQuery(query, nextSelected, fieldList);
    } else {
      let query = q.def(name, q.navigate(''))
      let selected = qp.select(qp.make(query), ['binding', 'query']);
      this.onQuery(query, selected);
    }
  };

  prependDefineAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    // TODO: need to allocate unique name
    let name = 'Query';
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertBefore(
        pointer,
        this.state.selected,
        q.def(name, q.navigate(''))
      );
      nextSelected = qp.select(nextSelected, ['binding', 'query']);
      let fieldList = this.state.fieldList.concat(name);
      this.onQuery(query, nextSelected, fieldList);
    } else {
      let query = q.def(name, q.navigate(''))
      let selected = qp.select(qp.make(query), ['binding', 'query']);
      this.onQuery(query, selected);
    }
  };

  appendFilterAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {
        query,
        selected: nextSelected
      } = qo.insertAfter(
        pointer,
        this.state.selected,
        q.filter(q.navigate('true'))
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.filter(q.navigate('true'))
      this.onQuery(query, qp.make(query));
    }
  };

  prependFilterAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {
        query,
        selected: nextSelected
      } = qo.insertBefore(
        pointer,
        this.state.selected,
        q.filter(q.navigate('true'))
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.filter(q.navigate('true'))
      this.onQuery(query, qp.make(query));
    }
  };

  appendAggregateAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        this.state.selected,
        q.aggregate('count')
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.aggregate('count');
      this.onQuery(query, qp.make(query));
    }
  };

  prependAggregateAction = (pointer: ?QueryPointer<*>) => {
    pointer = pointer ? pointer : this.state.query ? qp.make(this.state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        this.state.selected,
        q.aggregate('count')
      );
      this.onQuery(query, nextSelected);
    } else {
      let query = q.aggregate('count');
      this.onQuery(query, qp.make(query));
    }
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
      this.setState({
        query,
        selected: null,
        showAddColumnPanel: false,
        undoStack: this.state.undoStack.concat({
          query: this.state.query,
          selected: this.state.selected,
          fieldList: this.state.fieldList,
        }),
        redoStack: [],
      });
    } else {
      let nextQuery = q.inferType(this.props.domain, query);
      fieldList = updateFieldList(
        fieldList || this.state.fieldList,
        this.state.query,
        nextQuery,
      );
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
      this.props.onQuery(nextQuery);
      this.fetchData(addSelect(nextQuery, fieldList));
    }
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

  onToggleConsole = () => {
    this.setState({showConsole: !this.state.showConsole});
  };

  onFieldList = ({fieldList, close}: {fieldList: Array<string>; close: boolean}) => {
    this.setState(state => {
      return {
        ...state,
        fieldList,
        showAddColumnPanel: close ? false : state.showAddColumnPanel,
      };
    }, () => {
      if (this.state.query != null) {
        this.fetchData(addSelect(this.state.query, this.state.fieldList));
      }
    });
  };

  onConsoleChange = (e: UIEvent) => {
    let value = ((e.target: any): HTMLInputElement).value;
    if (value === '') {
      this.onQuery(null, null);
    } else {
      let node;
      try {
        node = parsing.parse(value);
      } catch (err) {
        if (err instanceof parsing.SyntaxError) {
          return;
        } else {
          throw err;
        }
      }
      let query = parsing.toQuery(this.props.domain, node);
      this.onQuery(query, null);
    }
  };

  render() {
    let {
      query,
      queryInvalid,
      fieldList,
      selected,
      data,
      showAddColumnPanel,
      showConsole
    } = this.state;

    let pointer = query != null ? qp.make(query) : null;

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
              onClick={this.onToggleConsole}
              active={showConsole}
              icon={<TerminalIcon />}
              size="small">
              Console
            </ReactUI.QuietButton>
            <ReactUI.QuietButton
              onClick={this.actions.export}
              icon={<DownloadIcon />}
              size="small">
              Export as .csv
            </ReactUI.QuietButton>
          </HBox>
        </QueryBuilderToolbar>
        {showConsole &&
          <Console basis="200px">
            <ConsoleInput onChange={this.onConsoleChange} />
          </Console>}
        <HBox grow={1}>
          <VBox basis="300px" overflow="auto"
            style={{boxShadow: css.boxShadow(0, 0, 3, 0, '#666')}}>
            <ui.QueryVis
              domain={this.props.domain}
              pointer={pointer}
              selected={selected}
              showAddColumnPanel={showAddColumnPanel}
              onAddColumn={this.onShowAddColumn}
              />
          </VBox>
          {(pointer && (selected || showAddColumnPanel)) &&
            <VBox basis="200px" grow={1}
              style={{boxShadow: css.boxShadow(0, 0, 3, 0, '#666')}}>
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
            {query && data != null && !queryInvalid
              ? fieldList.length === 0
                ? <NoColumnsMessage
                    showAddColumnPanel={showAddColumnPanel}
                    onAddColumn={this.onShowAddColumn}
                    />
                : <ui.DataTable
                    fieldList={fieldList}
                    onAddColumn={this.onShowAddColumn}
                    query={addSelect(query, fieldList)}
                    data={data}
                    />
              : queryInvalid
              ? <InvalidQueryMessage onUndo={this.actions.undo} />
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
    if (this.state.query != null) {
      this.fetchData(addSelect(this.state.query, this.state.fieldList));
    }
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

function updateFieldList(fieldList, prevQuery, nextQuery) {
  let allFieldList = getFieldList(nextQuery);
  let nextFieldList = fieldList.filter(field => {
    return allFieldList.indexOf(field) > -1;
  });

  // compare scopes and newly added ones
  for (let k in nextQuery.context.scope) {
    if (
      nextQuery.context.scope.hasOwnProperty(k) &&
      prevQuery && prevQuery.context.scope[k] == null &&
      nextFieldList.indexOf(k) === -1
    ) {
      nextFieldList.push(k);
    }
  }

  // TODO: think of the better heueristics for preserving prev fieldList
  return nextFieldList.length < 2 ? allFieldList : nextFieldList;
}

function addSelect(query: Query, fieldList: Array<string> = []) {
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

    if (type.name === 'void') {
      for (let k in domain.entity) {
        if (
          domain.entity.hasOwnProperty(k) &&
          fieldList.indexOf(k) > -1
        ) {
          fields[k] = q.navigate(k);
        }
      }
    }

    // add queries from scope
    if (type.name === 'entity' || type.name === 'void') {
      for (let k in scope) {
        if (scope.hasOwnProperty(k) && fieldList.indexOf(k) > -1) {
          fields[k] = q.navigate(k);
        }
      }
    }
  }
  if (Object.keys(fields).length > 0) {
    query = qo.insertAfter(qp.make(query), null, q.select(fields)).query;
    query = q.inferType(domain, query);
  }
  return query;
}

function InvalidQueryMessage({onUndo}) {
  return (
    <ui.Message>
      Query is invalid. You need to either fix it or
      <ReactUI.Button
        onClick={onUndo}
        style={{verticalAlign: 'middle', margin: 4, marginTop: 2}}
        icon={<ArrowLeftIcon />}
        size="small">
        return back
      </ReactUI.Button>
      to the previous state.
    </ui.Message>
  );
}

function NoColumnsMessage({onAddColumn, showAddColumnPanel}) {
  if (showAddColumnPanel) {
    return (
      <ui.Message>
        No columns configured.
      </ui.Message>
    );
  } else {
    return (
      <ui.Message>
        No columns configured.
        Click
        <ReactUI.FlatButton
          style={{verticalAlign: 'middle', margin: 4, marginTop: 2}}
          icon={<CogIcon />}
          size="small"
          onClick={onAddColumn}>
          Configure columns
        </ReactUI.FlatButton>
        to add a few.
      </ui.Message>
    );
  }
}

let QueryBuilderToolbar = style(HBox, {
  base: {
    zIndex: 2,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let Console = style(VBox, {
  base: {
    zIndex: 1,
    boxShadow: css.boxShadow(0, 0, 3, 0, '#666'),
  }
});

let ConsoleInput = style('textarea', {
  base: {
    width: '100%',
    height: '100%',
    padding: 10,
    fontFamily: 'Menlo, monospace',
    border: 'none',
  }
});
