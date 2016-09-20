/**
 * @flow
 */

import type {Query, Context} from './model/Query';
import type {QueryPointer, KeyPath} from './model/QueryPointer';

import invariant from 'invariant';
import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as css from 'react-dom-stylesheet/css';

import {formatQuery} from './QueryPrinter';
import {fetch} from './fetch';
import * as t from './model/Type';
import * as q from './model/Query';
import * as qp from './model/QueryPointer';
import * as qo from './model/QueryOperation';
import * as ui from './ui';

let domain: q.Domain = {
  aggregate: {
  },
  entity: {
    study: {
      attribute: {
        code: {type: t.textType},
        title: {type: t.textType},
        closed: {type: t.textType},
      }
    }
  }
};

type QueryBuilderProps = {

};

export default class QueryBuilder extends React.Component {

  props: QueryBuilderProps;
  state: {
    query: Query;
    selected: ?QueryPointer<Query>;
    data: ?Object;
    dataUpdating: boolean;
  };

  constructor(props: QueryBuilderProps) {
    super(props);

    /**
     * Set initial query here.
     */
    let query = q.inferType(domain, q.pipeline(
      q.navigate('study'),
    ));

    let selected = qp.select(qp.make(query), ['pipeline', 0]);

    this.state = {
      query,
      selected,
      data: null,
      dataUpdating: false,
    };
  }

  onSelect = (selected: QueryPointer<Query>) => {
    this.setState(state => {
      return {...state, selected};
    });
  }

  onQuery = (query: ?Query, selected: ?QueryPointer<*>) => {
    if (query == null) {
      query = q.navigate('study');
    }
    let nextQuery = q.inferType(domain, query);
    let nextSelected = null;
    if (selected) {
      nextSelected = qp.rebase(selected, nextQuery);
    }
    this.setState({query: nextQuery, selected: nextSelected});
    this.fetchData(nextQuery);
  };

  render() {
    let {query, selected, data, dataUpdating} = this.state;

    let pointer = qp.make(query);

    return (
      <HBox grow={1} height="100%">
        <VBox basis="300px" padding={4}>
          <ui.QueryVis
            domain={domain}
            pointer={pointer}
            onQuery={this.onQuery}
            selected={selected}
            onSelect={this.onSelect}
            />
        </VBox>
        {selected &&
          <VBox basis="200px" grow={1}>
            <ui.QueryPanel
              onClose={this.onSelect.bind(null, null)}
              pointer={selected}
              onQuery={this.onQuery}
              />
          </VBox>}
        <VBox basis="400px" grow={3} style={{borderLeft: css.border(1, '#ccc')}}>
          {!dataUpdating &&
            <ui.DataTable
              query={selectAll(query)}
              data={data}
              />}
        </VBox>
      </HBox>
    );
  }

  fetchData(query) {
    this.setState({dataUpdating: true});
    fetch('/query/', selectAll(query))
      .then(data => {
        this.setState({data, dataUpdating: false});
      });
  }

  componentDidMount() {
    this.fetchData(this.state.query);
  }
}

function selectAll(query: Query) {
  if (query.context != null && query.context.type != null) {
    let {domain, type} = query.context;
    type = t.atom(type);
    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      let fields = {};
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          fields[k] = q.navigate(k);
        }
      }
      query = qo.insertAfter(qp.make(query), null, q.select(fields)).query;
    }
  }
  return query;
}
