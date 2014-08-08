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

  render() {
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

  render() {
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
    hideColumns: PropTypes.array,
    showColumns: PropTypes.array,
    resizeableColumns: PropTypes.bool,

    selectable: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onSelected: PropTypes.func,

    sortedColumnId: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func
  },

  render() {
    console.log('Grid.render()');
    var rowRenderer = (
      <GridRow
        selected={this.props.selectable && this.props.selected}
        onSelected={this.props.selectable && this.props.onSelected}
        />
    );
    return (
      <BaseGrid
        columns={this.getColumns()}
        rows={this.getRows}
        onRows={this.onRows}
        length={this.getData().length}
        className="rex-widget-Grid"
        rowRenderer={rowRenderer}
        />
    );
  },

  getDefaultProps: function() {
    return {
      columns: {},
      hideColumns: [],
      selectable: false,
      onSelected: emptyFunction,
      onSort: emptyFunction,
      startPaginationBefore: 20
    };
  },

  /**
   * Decorate columns definition with information about resizeable columns,
   * sortable columns, ...
   *
   * @private
   */
  decorateColumns: function(columns) {
    var index = columns.index;
    if (this.props.hideColumns.length > 0) {
      columns = columns.filter((column) =>
          this.props.hideColumns.indexOf(column.key) === -1);
    }
    if (this.props.showColumns) {
      return this.props.showColumns.map((key) => this.decorateColumn(index[key]));
    } else {
      return columns.map(this.decorateColumn);
    }
  },

  decorateColumn(column) {
    var decorator = this.props.columns[column.key];
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
    if (this.props.resizeableColumns) {
      column = merge(column, {resizeable: true});
    }
    return column;
  },

  getColumns() {
    if (this.props.data.meta) {
      return this.getColumnsFromMeta(this.props.data.meta);
    } else if (Array.isArray(this.props.data)) {
      return this.getColumnsFromKeys(this.props.data);
    } else {
      return this.getColumnsFromData(this.props.data);
    }
  },

  getColumnsFromMeta: function(meta) {
    if (!this._columns || this._columns.meta !== meta) {
      var index = {};
      var columns = [];
      columns.index = index;
      columns.meta = meta;

      // XXX: find a way to do this for a general case
      // (need hierarchical columns in react-grid)
      var fields = meta.domain.item.domain.fields;

      for (var i = 0, len = fields.length; i < len; i++) {
        var column = {
          key: fields[i].tag,
          name: fields[i].header
        };
        columns.push(column);
        index[column.key] = column;
      }

      this._columns = this.decorateColumns(columns);
    }
    return this._columns;
  },

  getColumnsFromKeys: function(data) {
    if (data.length === 0)
      return [];
    var keys = Object.keys(data[0]);
    var columns = [];
    var index = {}
    columns.index = index;
    for (var i = 0, len = keys.length; i < len; i++) {
      var column = {
        key: keys[i],
        name: keys[i]
      };
      columns.push(column);
      index[column.key] = column;
    }
    this._columns = this.decorateColumns(columns);
    return this._columns;
  },

  getColumnsFromData: function(data) {
    var data = data.data;
    if (data.length === 0) {
      return [];
    }
    var keys = Object.keys(data[0]);
    var columns = [];
    var index = {};
    columns.index = index;
    for (var i = 0, len = keys.length; i < len; i++) {
      var column = {
        key: keys[i],
        name: keys[i]
      };
      columns.push(column);
      index[column.key] = column;
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
    if (
      Array.isArray(data)
      && data.length - end < this.props.startPaginationBefore
      && !updating
      && hasMore
    ) {
      console.log('Grid.onDataPagination()', updating, hasMore, this.props.onDataPagination);
      var {top, skip} = this.props.dataPagination;
      this.props.onDataPagination({top, skip: skip + top});
    }
  }
});

module.exports = Grid;
