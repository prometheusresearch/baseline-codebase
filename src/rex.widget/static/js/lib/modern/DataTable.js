/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Preloader               = require('../Preloader');
var BaseDataTable           = require('../DataTable');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var DataSpecification       = require('./DataSpecification');

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

var DataTable = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: DataSpecification.collection({
      'sort': new SortBinding(DataSpecification.state('sort'))
    })
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    var {dataSpec: data} = this.data;
    var {sort} = this.state;
    if (data.loading) {
      return <Preloader />;
    } else {
      return (
        <BaseDataTable
          {...this.props}
          onDataSort={this.onDataSort}
          dataSort={sort && `${sort.direction === 'desc' ? '-' : '+'}${sort.column}`}
          data={data}
          />
      );
    }
  },

  getInitialState() {
    return {sort: null};
  },

  onDataSort(sortDirection) {
    var direction = sortDirection[0] === '-' ? 'desc' : 'asc';
    var column = sortDirection.slice(1);
    this.setState({sort: {direction, column}});
  }
});

module.exports = DataTable;
