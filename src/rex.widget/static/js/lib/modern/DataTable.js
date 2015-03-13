/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Preloader               = require('../Preloader');
var BaseDataTable           = require('../DataTable');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var DataSpecification       = require('./DataSpecification');

var DataTable = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    data: DataSpecification.collection()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {data} = this.data;
    if (data.loading) {
      return <Preloader />;
    } else {
      return (
        <BaseDataTable
          {...this.props}
          data={data}
          />
      );
    }
  }
});

module.exports = DataTable;
