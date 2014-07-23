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
    var hovered = (
      this.props.hoveredRowId !== undefined
      && this.props.hoveredRowId === this.props.row.id
    );

    var className = cx({
      'rex-widget-GridRow': true,
      'rex-widget-GridRow--selected': selected,
      'rex-widget-GridRow--hovered': hovered
    });

    return this.transferPropsTo(
      <BaseRow
        className={className}
        onMouseEnter={this.onMouseEnter}
        onClick={this.onClick}
        />
    );
  },

  onClick: function() {
    this.props.onSelected(this.props.row.id);
  },

  onMouseEnter: function() {
    this.props.onHover(this.props.row.id);
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
    data: PropTypes.object.isRequired,
    onRows: PropTypes.func,

    columns: PropTypes.object,

    selectable: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onSelected: PropTypes.func,

    sortedColumnId: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func
  },

  getInitialState: function() {
    return {hoveredRowId: null};
  },

  render: function() {
    var columns = this.getColumns(this.props.data.meta);
    var rowRenderer = (
      <GridRow
        hoveredRowId={this.state.hoveredRowId}
        selected={this.props.selectable && this.props.selected}
        onSelected={this.props.selectable && this.props.onSelected}
        onHover={this.onHover}
        />
    );
    return (
      <BaseGrid
        columns={columns}
        rows={this.getRows}
        length={this.props.data.data.length}
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

  onHover: function(hoveredRowId) {
    this.setState({hoveredRowId});
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

  getColumns: function(meta) {
    if (!this._columns || this._columns.meta !== meta) {
      var columns = [];

      // XXX: find a way to do this for a general case
      // (need hierarchical columns in react-grid)
      var fields = meta.domain.fields[0].domain.item.domain.fields;

      for (var i = 0, len = fields.length; i < len; i++) {
        var column = {
          key: fields[i].header,
          name: fields[i].header
        };
        columns.push(column);
      }

      this._columns = this.decorateColumns(columns);
      this._columns.meta = meta;
    }
    return this._columns;
  },

  getRows: function(start, stop) {
    setTimeout(() => {
      if (this.props.data.data.length - stop < 20
          && !this.props.data.updating
          && this.props.data.hasMore) {
        this.props.onDataPagination({
          top: this.props.dataPagination.top,
          skip: this.props.dataPagination.skip + this.props.dataPagination.top
        });
      }
    }, 0);
    return this.props.data.data.slice(start, stop);
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
