/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Immutable               = require('immutable');
var Preloader               = require('./Preloader');
var BaseDataTable           = require('./BaseDataTable');
var DataSet                 = require('./DataSet');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var DataSpecification       = require('./DataSpecification');

var SKIP_PARAM = '*:skip';
var TOP_PARAM = '*:top';

class SortBinding extends DataSpecification.Binding {

  constructor(binding, options) {
    super(options);
    this.binding = binding;
  }

  bindToContext(context, key) {
    var {value} = this.binding.bindToContext(context, key)[key];
    var bind = {};
    if (value) {
      bind[`*.${value.column}:sort`] = new DataSpecification.Value(value.direction, this.options);
    }
    return bind;
  }
}

class PaginationBinding extends DataSpecification.Binding {

  constructor(binding, options) {
    super(options);
    this.binding = binding;
  }

  bindToContext(context, key) {
    var {value} = this.binding.bindToContext(context, key)[key];
    var bind = {};
    if (value) {
      bind[TOP_PARAM] = new DataSpecification.Value(value.top, this.options);
      bind[SKIP_PARAM] = new DataSpecification.Value(value.skip, this.options);
    }
    return bind;
  }
}

function diffParams(a, b) {
  var diff = [];
  a.forEach((v, k) => {
    if (!Immutable.is(v, b.get(k))) {
      diff.push(k);
    }
  });
  return diff;
}

function isPagination(params, prevParams) {
  prevParams = prevParams || Immutable.Map();
  var diff = diffParams(params, prevParams);
  return diff.length === 1 && diff[0] === SKIP_PARAM;
}

/**
 * DataTable component.
 *
 * @public
 */
var DataTable = React.createClass({
  mixins: [DataSpecificationMixin],

  propTypes: {

    /**
     * An array of column specifications.
     *
     * Each column has a form of::
     *
     *   {
     *     valueKey: <column key>,
     *     label: <column name>,
     *     width: <column width>,
     *     sortable: <if column should be made sortable>,
     *     resizable: <if column should be made resizable>
     *   }
     *
     */
    columns: React.PropTypes.array.isRequired,

    /**
     * Data specification which is used to fetch data for datatable.
     */
    dataSpec: React.PropTypes.object.isRequired,

    /**
     * If DataTable should allow selecting its rows.
     */
    selectable: React.PropTypes.bool,

    /**
     * Callback which is executed when selected row changes, it is provided with
     * row id and row itself as its arguments.
     */
    onSelected: React.PropTypes.func,

    /**
     * Currently selected row id.
     */
    selected: React.PropTypes.string
  },

  dataSpecs: {
    dataSpec: new DataSpecification.Collection(null, {
      sort: new SortBinding(DataSpecification.state('sort')),
      pagination: new PaginationBinding(DataSpecification.state('pagination'))
    }, {
      strategy: DataSpecification.QUEUE_ON_UPDATE
    })
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    var {dataSpec: data} = this.data;
    var {sort, pagination, hasMore} = this.state;
    if (data.data === null || data.loading && pagination.skip === 0) {
      return <Preloader />;
    } else {
      return (
        <BaseDataTable
          {...this.props}
          hasMore={hasMore}
          dataSort={sort ? `${sort.direction === 'desc' ? '-' : '+'}${sort.column}` : this.props.dataSort}
          onDataSort={this.onDataSort}
          dataPagination={pagination}
          onDataPagination={this.onDataPagination}
          data={data}
          />
      );
    }
  },

  getInitialState() {
    return {
      ...this.getInitialPaginationState(),
      sort: null,
    };
  },

  getInitialPaginationState() {
    return {
      pagination: {top: 50, skip: 0},
      hasMore: true
    };
  },

  componentWillReceiveProps(nextProps) {
    if (!Immutable.is(nextProps.dataSpec.produceParams(), this.props.dataSpec.produceParams())) {
      this.setState(this.getInitialPaginationState());
    }
  },

  onForceRefreshData() {
    // reset pagination state
    this.setState(this.getInitialPaginationState(), () => {
      this.fetchData(true);
      this.forceUpdate();
    });
  },

  onDataFetch(key, params, prevParams) {
    if (key === 'dataSpec' && isPagination(params, prevParams)) {
      // keep dataset but update loading flag
      var prevData = this.data[key];
      this.data[key] = new DataSet(prevData.data, true, prevData.error);
    } else {
      this.data[key] = new DataSet([], true, null);
    }
  },

  onData(data, key, params, prevParams) {
    if (key === 'dataSpec' && data) {
      if (data.length < this.state.pagination.top) {
        this.setState({hasMore: false});
      }
    }
    if (key === 'dataSpec' && data && isPagination(params, prevParams)) {
      // append dataset to the already loaded dataset
      var prevData = this.data[key].data || [];
      this.data[key] = new DataSet(prevData.concat(data), false, null);
    } else {
      this.data[key] = new DataSet(data, false, null);
    }
  },

  onDataSort(sortDirection) {
    var direction = sortDirection[0] === '-' ? 'desc' : 'asc';
    var column = sortDirection.slice(1);
    this.setState({
      ...this.getInitialPaginationState(),
      sort: {direction, column}
    });
  },

  onDataPagination(pagination) {
    this.setState({pagination});
  }
});

module.exports = DataTable;
