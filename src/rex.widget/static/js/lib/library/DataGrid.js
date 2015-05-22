/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var DataTableWithSearch = require('../DataTableWithSearch');
var DataTable           = require('../DataTable');

var DataGrid = React.createClass({

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
