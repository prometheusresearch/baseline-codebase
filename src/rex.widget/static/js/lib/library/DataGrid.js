/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var DataTableWithSearch = require('../DataTableWithSearch');
var DataTable           = require('../DataTable');

/**
 * Renders a <DataTableWithSearch> with a <DataTable>
 */
var DataGrid = React.createClass({

  propTypes: {
    /**
     * object
     *
     * Data specification which is used to fetch data for datatable.
     */
    data: React.PropTypes.object,

    /**
     * array
     *
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
     * bool
     *
     * When ``false``, only the <DataTable> is rendered.
     */
    withSearchFilter: React.PropTypes.bool,
    
    /**
     * string
     *
     * Placeholder for search. 
     * The placeholder is a short hint which appears in the field
     * before the user types into the field.
     */
    searchPlaceholder: React.PropTypes.string
  },

  render() {
    var {data, columns, withSearchFilter, searchPlaceholder, ...props} = this.props;
    if (withSearchFilter) {
      return (
        <DataTableWithSearch dataSpec={data} searchPlaceholder={searchPlaceholder}>
          <DataTable
            sortable
            resizableColumns
            selectable
            {...props}
            columns={columns}
            />
        </DataTableWithSearch>
      );
    } else {
      return (
        <DataTable
          {...props}
          dataSpec={data}
          columns={columns}
          />
      );
    }
  }
});

module.exports = DataGrid;
