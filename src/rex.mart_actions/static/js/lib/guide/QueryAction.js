/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {contextTypes} from 'rex-action/lib/ActionContext';
import {
  autobind,
  transferStaticProperties,
  isString
} from 'rex-widget/lang';

import {parse as parseHTSQL} from './htsql/grammar.pegjs';
import * as AST from './htsql/AST';
import DB from './DB';

/**
 * Component decorator to apply on action which work on Rex Guide queries.
 *
 * It provides two additonal props:
 *
 * - ``query`` which represents the current query value from the context.
 * - ``onQueryUpdate`` is callback which should be used when action is ready to
 *   update query in the context.
 *
 * Usage is as simple as::
 *
 *    @QueryAction
 *    class MyRexGuideAction extends React.Component {
 *
 *      render() {
 *        let {query, db, onQueryUpdate} = this.props
 *      }
 *    }
 *
 * Note that it is required for a guide action to provide a ``table`` prop with
 * a type which represents the table query is operating upon.
 */
export default function QueryAction(Component) {

  let displayName = Component.displayName || Component.name;

  let QueryActionContainer = class extends React.Component {

    static displayName = `QueryAction(${displayName})`;

    constructor(props) {
      super(props);
      this.query = null;
      this.db = null;
      this._initializeQuery(props);
    }

    render() {
      return (
        <Component
          {...this.props}
          query={this.query}
          db={this.db}
          onQueryUpdate={this._onQueryUpdate}
          />
      );
    }

    componentWillReceiveProps(nextProps) {
      let query = this.props.context.query;
      let nextQuery = nextProps.context.query;
      if (
        typeof nextQuery !== typeof query ||
        typeof nextQuery === 'object' && nextQuery.unparse() !== query.unparse() ||
        typeof nextQuery === 'string' && nextQuery !== query
      ) {
        this._initializeQuery(nextProps);
      }
    }

    _initializeQuery(props) {
      let {
        context: {query, mart},
        table,
        tableFields
      } = props;
      if (!query) {
        let fields = tableFields.map(f => new AST.Field(f.expression));
        query = new AST.Collection(table, [new AST.Projection(fields)]);
      } else if (isString(query)) {
        query = parseHTSQL('/' + query);
      }
      let db = DB(query, mart);
      this.query = query;
      this.db = db;
    }

    @autobind
    _onQueryUpdate(query) {
      this.props.onContextNoAdvance({query: query.unparse()});
    }
  };

  transferStaticProperties(Component, QueryActionContainer);

  return QueryActionContainer;
}
