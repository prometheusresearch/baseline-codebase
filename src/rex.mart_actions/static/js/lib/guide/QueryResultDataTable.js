/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import {autobind} from 'rex-widget/lang';
import {VBox} from 'rex-widget/layout';
import {LoadingIndicator} from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import {DataTableBase} from 'rex-widget/datatable';
import * as stylesheet from 'rex-widget/stylesheet';

let style = stylesheet.create({
  Count: {
    Component: VBox,
    fontWeight: 'bold',
    fontSize: '80%',
    padding: 5
  }
});

function fetch({data, pagination, sort}) {
  let count = data.count();
  if (sort.valueKey) {
    data = data.sort(sort.valueKey, sort.asc);
  }
  data = data.limit(pagination.top, pagination.skip);
  return {count, data};
}

function update(props, data, prevData, key) {
  if (data.length === 0) {
    data = data.setHasMore(false);
  }
  if (key === 'data' && props.pagination.skip > 0) {
    data = data.setData(prevData.data.concat(data.data));
  }
  return data;
}

@Fetch({fetch, update})
export default class QueryResultDataTable extends React.Component {

  static propTypes = {
    data: PropTypes.object,
    columns: PropTypes.array,
    className: PropTypes.string,
  };

  static defaultProps = {
    pagination: {top: 100, skip: 0},
    sort: {valueKey: null, asc: true},
  };

  constructor(props) {
    super(props);
    this._rowIndexMax = null;
    this._columns = null;
  }

  get columns() {
    return this.props.columns || this._columns;
  }

  render() {
    let {
      className,
      fetched: {data, count},
      dataParams
    } = this.props;
    let {pagination, sort} = dataParams;

    if (!this.columns && !data.updating && data.data) {
      this._columns = columnsFromRow(data.data[0]);
    }

    if (data.updating || !this.columns) {
      return (
        <VBox flex={1} alignItems="center" justifyContent="center">
          <LoadingIndicator />
        </VBox>
      );
    } else if (!data.updating && !data.data) {
      return (
        <VBox flex={1} alignItems="center" justifyContent="center">
          No data...
        </VBox>
      );
    } else {
      return (
        <VBox flex={1}>
          <VBox flex={1}>
            <DataTableBase
              {...this.props}
              columns={this.columns}
              pagination={pagination}
              onPagination={this.onPagination}
              sort={sort}
              onSort={this.onSort}
              data={data}
              />
          </VBox>
          <style.Count>
            {count.updating ?
              <LoadingIndicator /> :
              <span>Total rows found: {count.data}</span>}
          </style.Count>
        </VBox>
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.data.equals(this.props.data)) {
      this.props.setDataParams({
        pagination: {top: nextProps.pagination.top, skip: 0},
      });
    }
  }

  @autobind
  onPagination(pagination) {
    this.props.setDataParams({pagination});
  }

  @autobind
  onSort(sort) {
    let pagination = {top: this.props.pagination.top, skip: 0};
    this.props.setDataParams({sort, pagination});
  }

}

function columnsFromRow(row) {
  let columns = [];
  for (let key in row) {
    if (row.hasOwnProperty(key)) {
      columns.push({valueKey: [key], label: key});
    }
  }
  return columns;
}
