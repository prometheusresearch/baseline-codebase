/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;
var cx            = React.addons.classSet;
var BaseGrid      = require('react-grid');
var BaseRow       = require('react-grid/lib/Row');
var emptyFunction = require('./emptyFunction');
var merge         = require('./merge');
var mergeInto     = require('./mergeInto');

var GridRow = React.createClass({

  render: function() {
    var selected = (
      this.props.selected !== undefined
      && this.props.selected === this.props.row.id
    );
    var className = cx({
      'rex-widget-GridRow': true,
      'rex-widget-GridRow--selected': selected
    });

    return this.transferPropsTo(
      <BaseRow
        ref="row"
        className={className}
        onMouseEnter={this.onMouseEnter}
        onClick={this.onClick}
        />
    );
  },

  setScrollLeft: function(scrollLeft) {
    this.refs.row.setScrollLeft(scrollLeft);
  },

  onClick: function() {
    this.props.onSelected(this.props.row.id);
  }
});

var SortableGridHeaderCell = React.createClass({

  render: function() {
    var sorted = this.props.column.sorted

    var icon = sorted ?
      (sorted === 'asc' ?  '↓' : '↑') :
      null

    return (
      <div onClick={this.onClick}>
        {this.props.column.name}
        <span>{icon}</span>
      </div>
    )
  },

  onClick: function() {
    var sorted = this.props.column.sorted;
    sorted = sorted === 'asc' ?
      'desc' : 'asc';
    this.props.column.onSort(
      this.props.column,
      sorted)
  }
});

var Grid = React.createClass({

  propTypes: {
    data: PropTypes.oneOfType([
      PropTypes.object.isRequired,
      PropTypes.array.isRequired
    ]),

    columns: PropTypes.object,

    selectable: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onSelected: PropTypes.func,

    sortedColumnId: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func
  },

  render: function() {
    var columns = [];
    var length = null;
    if (this.props.data.meta) {
      columns = this.getColumnsFromMeta(this.props.data.meta);
      length = this.props.data.data.length;
    } else if (Array.isArray(this.props.data)) {
      columns = this.getColumnsFromKeys(this.props.data);
      length = this.props.data.length;
    } else {
      columns = this.getColumnsFromData(this.props.data);
      length = this.props.data.data.length;
    }

    var rowRenderer = (
      <GridRow
        selected={this.props.selectable && this.props.selected}
        onSelected={this.props.selectable && this.props.onSelected}
        />
    );
    return (
      <BaseGrid
        columns={columns}
        rows={this.getRows}
        onRows={this.onRows}
        length={length}
        className="rex-widget-Grid"
        rowRenderer={rowRenderer}
        />
    );
  },

  getDefaultProps: function() {
    return {
      columns: {},
      selectable: false,
      onSelected: emptyFunction,
      onSort: emptyFunction
    };
  },

  /**
   * Decorate columns definition with information about resizeable columns,
   * sortable columns, ...
   *
   * @private
   */
  decorateColumns: function(columns) {
    var decorators = this.props.columns;

    return columns.map((column) => {
      var decorator = decorators[column.key];

      if (decorator) {
        column = merge(column, decorator);
        if (column.sortable) {
          mergeInto(column, {
            sorted: this.props.sortedColumnId === column.key ? this.props.sortDirection : undefined,
            headerRenderer: SortableGridHeaderCell,
            onSort: this.props.onSort
          });
        }
      }

      return column;
    });
  },

  getColumnsFromMeta: function(meta) {
    if (!this._columns || this._columns.meta !== meta) {
      var columns = [];

      // XXX: find a way to do this for a general case
      // (need hierarchical columns in react-grid)
      var fields = meta.domain.item.domain.fields;

      for (var i = 0, len = fields.length; i < len; i++) {
        var column = {
          key: fields[i].tag,
          name: fields[i].header
        };
        columns.push(column);
      }

      this._columns = this.decorateColumns(columns);
      this._columns.meta = meta;
    }
    return this._columns;
  },

  getColumnsFromKeys: function(data) {
    if (data.length === 0)
      return [];
    var keys = Object.keys(data[0]);
    var columns = [];
    for (var i = 0, len = keys.length; i < len; i++) {
        var column = {
          key: keys[i],
          name: keys[i]
        };
        columns.push(column);
    }
    this._columns = this.decorateColumns(columns);
    return this._columns;
  },

  getColumnsFromData: function(data) {
    var data = data.data;
    if (data.length === 0)
      return [];
    var keys = Object.keys(data[0]);
    var columns = [];
    for (var i = 0, len = keys.length; i < len; i++) {
        var column = {
          key: keys[i],
          name: keys[i]
        };
        columns.push(column);
    }
    this._columns = this.decorateColumns(columns);
    return this._columns;
  },

  getData() {
    var data = this.props.data;
    return Array.isArray(data) ? data : data.data;
  },

  getRows: function(start, end) {
    return this.getData().slice(start, end);
  },

  onRows({start, end}) {
    var {updating, hasMore, data} = this.props.data;
    if (data.length - end < 20 && !updating && hasMore) {
      this.props.onDataPagination({
        top: this.props.dataPagination.top,
        skip: this.props.dataPagination.skip + this.props.dataPagination.top
      });
    }
  },

  requestMoreRows: function() {
    if (this.requestMoreRowsRequired) {
      this.requestMoreRowsRequired = undefined;
    }
  },

  componentDidMount: function() {
    this.requestMoreRows();
  },

  componentDidUpdate: function() {
    this.requestMoreRows();
  },

  componentWillUmount: function() {
    this.requestMoreRowsRequired = undefined;
  }
});

module.exports = Grid;
