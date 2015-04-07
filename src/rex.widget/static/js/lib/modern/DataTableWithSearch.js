/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react/addons');
var {cloneWithProps}        = React.addons;
var {collection, state}     = require('./DataSpecification');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var Layout                  = require('./Layout');
var SearchInput             = require('./SearchInput');
var Cell                    = require('./Cell');
var DataTable               = require('./DataTable');

var DataTableWithSearchStyle = {
  searchBar: {
    marginBottom: 10
  }
};

var DataTableWithSearch = React.createClass({
  mixins: [DataSpecificationMixin, Cell.Mixin],

  dataSpecs: {
    dataSpec: collection({'*:search': state('search')})
  },

  render() {
    var {searchPlaceholder, children, ...props} = this.props;
    children = cloneWithProps(children, {
      ...props,
      dataSpec: this.dataSpecs.dataSpec
    });
    return (
      <Layout.VBox childrenMargin={10} size={1}>
        <SearchInput
          style={DataTableWithSearchStyle.searchBar}
          throttleOnChange={500}
          placeholder={searchPlaceholder}
          value={this.state.search.value}
          onChange={this.state.search.update}
          />
        {children}
      </Layout.VBox>
    );
  },

  getDefaultProps() {
    return {
      children: <DataTable />
    };
  },

  getInitialState() {
    return {
      search: Cell.cell(null)
    };
  }
});

module.exports = DataTableWithSearch;
