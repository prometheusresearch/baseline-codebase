/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Fetch              from '../data/Fetch';
import DataTableBase      from './DataTableBase';


export let DataSpec = {

  fetch({data, pagination: {top, skip}, sort}) {
    data = data.limit(top, skip);
    if (sort && sort.valueKey) {
      data = data.sort(sort.valueKey, sort.asc);
    }
    return {data};
  },

  update({pagination: {skip}}, data, prevData) {
    if (data.length !== 0) {
      data = data.setHasMore(true);
    }
    if (skip > 0) {
      data = data.setData(prevData.data.concat(data.data));
    }
    return data;
  }

};

export class DataTable extends React.Component {

  static propTypes = {
    /**
     * Data fetch task.
     */
    data: PropTypes.object,

    /**
     * Pagination.
     */
    pagination: PropTypes.object,

    /**
     * Sorting.
     */
    sort: PropTypes.object,
  };

  static defaultProps = {
    pagination: {top: 50, skip: 0},
    sort: {valueKey: null, asc: true},
  };

  render() {
    let {dataParams: {pagination, sort}, fetched: {data}} = this.props;
    return (
      <DataTableBase
        {...this.props}
        pagination={pagination}
        onPagination={this.onPagination}
        sort={sort}
        onSort={this.onSort}
        data={data}
        />
    );
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.data.equals(nextProps.data)) {
      let pagination = this.props.pagination;
      this.props.setDataParams({pagination});
    }
  }

  onPagination = (pagination) => {
    this.props.setDataParams({pagination});
  };

  onSort = (sort) => {
    let pagination = this.props.pagination;
    this.props.setDataParams({sort, pagination});
  };
}

export default Fetch(DataSpec)(DataTable);
