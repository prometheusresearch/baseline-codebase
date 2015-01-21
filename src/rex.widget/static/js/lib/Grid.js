/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;

var BaseRow         = require('react-grid/lib/Row');
var Header          = require('react-grid/lib/Header');
var Viewport        = require('react-grid/lib/Viewport');
var ColumnMetrics   = require('react-grid/lib/ColumnMetrics');
var DOMMetrics      = require('react-grid/lib/DOMMetrics');
var GridScrollMixin = require('react-grid/lib/GridScrollMixin');

var Icon          = require('./Icon');
var emptyFunction = require('./emptyFunction');
var invariant     = require('./invariant');
var merge         = require('./merge');
var mergeInto     = require('./mergeInto');
var isString      = require('./isString');
var formatters    = require('./formatters');
var runtime       = require('./runtime');
var {Box}         = require('./layout');

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
    var {selected, row, ...props} = this.props;
    selected = (
      selected !== undefined
      && selected == this.props.row.id
    );
    var className = cx({
      'rw-GridRow': true,
      'rw-GridRow--selected': selected
    });

    return (
      <BaseRow
        {...props}
        ref="row"
        row={row}
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
    var {sorted, name} = this.props.column;

    var icon = sorted ?
      (sorted === '+' ?
        <Icon name="sort-by-attributes" /> :
        <Icon name="sort-by-attributes-alt" />) :
        <Icon name="sort" className="rw-Grid__sortableIndicator" />;

    return (
      <div title={name} className="react-grid-HeaderCell__value" onClick={this.onClick}>
        {icon} {name}
      </div>
    )
  },

  onClick: function() {
    var sorted = this.props.column.sorted;
    var direction = sorted === '+' ?  '-' : '+';
    this.props.column.onSort(`${direction}${this.props.column.key}`);
  }
});

var BaseGrid = React.createClass({
  mixins: [
    GridScrollMixin,
    ColumnMetrics.Mixin,
    DOMMetrics.MetricsComputatorMixin
  ],

  style: {
    overflow: 'hidden',
    outline: 0
  },

  render() {
    return this.transferPropsTo(
      <Box size={1} style={this.style}>
        <Header
          style={Box.makeBoxStyle({height: this.props.rowHeight})}
          ref="header"
          columns={this.state.columns}
          onColumnResize={this.onColumnResize}
          height={this.props.rowHeight}
          totalWidth={this.DOMMetrics.gridWidth()}
          />
        <Viewport
          style={merge(Box.makeBoxStyle({size: 1}), {top: 0})}
          ref="viewport"
          width={this.state.columns.width}
          rowHeight={this.props.rowHeight}
          rowRenderer={this.props.rowRenderer}
          cellRenderer={this.props.cellRenderer}
          rows={this.props.rows}
          length={this.props.length}
          columns={this.state.columns}
          totalWidth={this.DOMMetrics.gridWidth()}
          onScroll={this.onScroll}
          onRows={this.props.onRows}
          />
      </Box>
    );
  },

  getDefaultProps() {
    return {
      rowHeight: 35
    };
  },
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

    autoSelect: PropTypes.bool,
    selectable: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onSelected: PropTypes.func,

    dataSort: PropTypes.string,
    onSort: PropTypes.func,

    sortDirection: PropTypes.string
  },

  render() {
    var {selectable, selected, onSelected, className} = this.props;
    var rowRenderer = (
      <GridRow
        selected={selectable && selected}
        onSelected={selectable && this.onSelected}
        />
    );
    var columns = this.getColumns();
    return (
      <BaseGrid
        columnEquality={sameColumn}
        columns={columns}
        rows={this.getRows}
        onRows={this.onRows}
        length={this.getData().length}
        className={cx('rw-Grid', className)}
        rowRenderer={rowRenderer}
        />
    );
  },

  getDefaultProps() {
    return {
      columns: {},
      hideColumns: [],
      selectable: false,
      onSelected: emptyFunction,
      onSort: emptyFunction,
      startPaginationBefore: 20
    };
  },

  componentDidMount() {
    this.checkAutoSelect();
  },

  componentDidUpdate() {
    this.checkAutoSelect();
  },

  onSelected(rowID) {
    this.props.onSelected(rowID);
    if (this.props.onSelect) {
      this.props.onSelect();
    }
  },

  checkAutoSelect() {
    var {autoSelect, selected, selectable} = this.props;
    if (autoSelect && selectable && selected == null) {
      var firstRow = this.getData()[0];
      if (firstRow) {
        this.props.onSelected(firstRow.id, {persistence: runtime.ApplicationState.PERSISTENCE.INVISIBLE});
      }
    }
  },

  /**
   * Decorate columns definition with information about resizeable columns,
   * sortable columns, ...
   *
   * @private
   */
  decorateColumns(columns) {
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
    }
    if (column.sortable) {
      mergeInto(column, {
        sorted: sort.key === column.key ? sort.direction : undefined,
        headerRenderer: SortableGridHeaderCell,
        onSort: this.props.onDataSort
      });
    }
    if (column.formatter && isString(column.formatter)) {
      var formatter = formatters.resolve(column.formatter);
      invariant(
        formatter !== undefined,
        'invalid formatter "%s"', column.formatter
      );
      mergeInto(column, {formatter});
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

  getColumnsFromMeta(meta) {
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

  getColumnsFromKeys(data) {
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

  getColumnsFromData(data) {
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

  getRows(start, end) {
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
