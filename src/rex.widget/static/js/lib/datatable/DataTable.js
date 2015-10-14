/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import autobind           from 'autobind-decorator';
import DataComponent      from '../data/DataComponent';
import DataTableBase      from './DataTableBase';

@DataComponent
export default class DataTable extends React.Component {

  static propTypes = {
    data: PropTypes.object
  };

  static defaultProps = {
    top: 50
  };

  constructor(props) {
    super(props);
    this._rowIndexMax = null;
    this.state = {
      columnWidth: {},
      sort: props.sort || {valueKey: null, asc: true},
      pagination: {top: props.top, skip: 0},
      isPagination: false,
      hasMore: true
    };
  }

  fetch() {
    let {
      pagination: {top, skip},
      sort: {valueKey, asc}
    } = this.state;
    let data = this.props.data.limit(top, skip);
    if (valueKey) {
      data = data.sort(valueKey, asc);
    }
    return {data};
  }

  render() {
    return (
      <DataTableBase
        {...this.props}
        pagination={this.state.pagination}
        hasMore={this.state.hasMore}
        onPagination={this.onPagination}
        sort={this.state.sort}
        onSort={this.onSort}
        dataSet={this.dataSet.data}
        data={undefined}
        />
    );
  }

  @autobind
  onPagination(pagination) {
    this.setState({
      pagination,
      isPagination: true
    });
  }

  @autobind
  onSort(sort) {
    this.setState({sort});
  }

  onData(key, data, prevData) {
    if (data.length === 0) {
      this.setState({hasMore: false});
    }
    if (key === 'data' && prevData && this.state.isPagination) {
      this.setState({isPagination: false});
      data = prevData.concat(data);
    }
    return data;
  }
}
