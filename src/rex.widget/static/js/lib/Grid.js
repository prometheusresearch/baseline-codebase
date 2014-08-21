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

function sameColumn(a, b) {
  var k;

  for (k in a) {
    if (k === 'sorted') {
      continue;
    }
    if (a.hasOwnProperty(k)) {
      if (typeof a[k] === 'function' && typeof b[k] === 'function') {
        continue;
      }
      if (!b.hasOwnProperty(k) || a[k] !== b[k]) {
        return false;
      }
    }
  }

  for (k in b) {
  //if (k === 'sorted') {
  //  continue;
  //}
    if (b.hasOwnProperty(k) && !a.hasOwnProperty(k)) {
      return false;
    }
  }

  return true;
}

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
      (sorted === '+' ?  '↓' : '↑') :
      null

    return (
      <div className="react-grid-HeaderCell__value" onClick={this.onClick}>
        {this.props.column.name}
        <span className="rex-widget-Grid__sortIcon">{icon}</span>
      </div>
    )
  },

  onClick: function() {
    var sorted = this.props.column.sorted;
    var direction = sorted === '+' ?
      '-' : '+';
    this.props.column.onSort(`${direction}${this.props.column.key}`);
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

    dataSort: PropTypes.string,
    onSort: PropTypes.func,

    sortDirection: PropTypes.string
  },

  render() {
    var rowRenderer = (
      <GridRow
        selected={this.props.selectable && this.props.selected}
        onSelected={this.props.selectable && this.props.onSelected}
        />
    );
    return (
      <BaseGrid
        columnEquality={sameColumn}
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
    var sort = this.getSortSpec();
    if (this.props.sortableColumns) {
      column = merge(column, {sortable: true});
    }
    if (this.props.resizeableColumns) {
      column = merge(column, {resizeable: true});
    }
    var decorator = this.props.columns[column.key];
    if (decorator) {
      column = merge(column, decorator);
      if (column.sortable) {
        mergeInto(column, {
          sorted: sort.key === column.key ? sort.direction : undefined,
          headerRenderer: SortableGridHeaderCell,
          onSort: this.props.onDataSort
        });
      }
    }
    return column;
  },

  getSortSpec() {
    if (this.props.dataSort) {
      var key;
      var direction;
      var sort = this.props.dataSort;
      if (sort[0] === '-' || sort[0] === '+') {
        key = sort[0] === '-' || sort[0] === '+' ? sort.slice(1) : sort;
        direction = sort[0];
      } else {
        key = sort;
        direction = '+';
      }
      return {key, direction};
    } else {
      return {key: null, direction: '+'};
    }
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
      var {top, skip} = this.props.dataPagination;
      this.props.onDataPagination({top, skip: skip + top});
    }
  }
});

module.exports = Grid;
