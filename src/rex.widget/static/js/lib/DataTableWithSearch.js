/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
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

/**
 * Displays a <SearchInput> widget and children
 * inside a <VBox>.
 *
 * @public
 */
var DataTableWithSearch = React.createClass({
  mixins: [DataSpecificationMixin, Cell.Mixin],

  dataSpecs: {
    dataSpec: collection({'*:search': state('search')})
  },

  propTypes: {

    /**
     * Placeholder for search. 
     * The placeholder is a short hint which appears in the field
     * before the user types into the field.
     */
    searchPlaceholder: React.PropTypes.string,

    /**
     * children elements to render.
     */
    children: React.PropTypes.element
    },

  render() {
    var {searchPlaceholder, children, ...props} = this.props;
    children = React.cloneElement(children, {
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
