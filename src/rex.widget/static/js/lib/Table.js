/**
 * Simple table widget.
 *
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var PropTypes = React.PropTypes;
var cx        = React.addons.classSet;
var Preloader = require('./Preloader');

var Table = React.createClass({

  propTypes: {
    data: PropTypes.object.isRequired,
    columns: PropTypes.array.isRequired,
    calculatedColumns: PropTypes.array,
    calculatedRows: PropTypes.array,
    className: PropTypes.string,
    selectable: PropTypes.bool,
    selected: PropTypes.string
  },

  render: function() {
    if (this.props.data.updating) {
      return <Preloader />;
    }
    var columns = this.props.columns
    var rows = this.props.data.data

    var calculatedColumns = this.props.calculatedColumns;
    var calculatedRows = this.props.calculatedRows

    var transposedData = {};
    return (
      <table className={cx('rex-widget-Table', this.props.className)}>
        <thead>
          <tr>
            {columns.map((column) =>
              <th key={column.key}>{column.title}</th>
            )}
            {calculatedColumns.map((column) =>
              <th key={column.key} className="rex-widget-Table__calculatedColumn">{column.title}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            var selected = this.props.selectable && this.props.selected === row.id;
            var className=cx({
              'rex-widget-Table__row': true,
              'rex-widget-Table__row--selected': selected
            });
            return (
              <tr className={className} onClick={this.onSelected.bind(null, row.id)} key={rowIndex}>
                {columns.map((column) => {
                  if (transposedData[column.key] === undefined) {
                    transposedData[column.key] = [row[column.key]];
                  } else {
                    transposedData[column.key].push(row[column.key]);
                  }
                  return (
                    <td key={column.key}>
                      {column.formatter ? column.formatter(row[column.key], column.key, row) : row[column.key]}
                    </td>
                  );
                })}

                {calculatedColumns.map((column) => {
                  var value = column.calculate(row, columns);
                  if (transposedData[column.key] === undefined) {
                    transposedData[column.key] = [value];
                  } else {
                    transposedData[column.key].push(value);
                  }
                  return (
                    <td className="rex-widget-Table__calculatedColumn" key={column.key}>
                      {column.formatter ? column.formatter(value, column.key, row) : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {calculatedRows.map((row, rowIndex) =>
            <tr key={rowIndex} className="rex-widget-Table__calculatedRow">
              {columns.map((column, index) => {
                var value = row.calculate(transposedData[column.key], column.key, index, column);
                if (column.skipInTotal)
                  return '';
                return (
                  <td key={column.key} colSpan={column.colSpan}>
                    {column.formatter ? column.formatter(value, column.key, row) : value}
                  </td>
                );
              })}
              {calculatedColumns.map((column, index) => {
                var value = row.calculate(transposedData[column.key], column.key, columns.length + index);
                return (
                  <td className="rex-widget-Table__calculatedColumn" key={column.key}>
                    {column.formatter ? column.formatter(value , column.key, row) : value}
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
    );
  },

  onSelected: function(rowID) {
    if (this.props.selectable) {
      this.props.onSelected(rowID);
    }
  },

  getDefaultProps: function() {
    return {
      calculatedColumns: [],
      calculatedRows: []
    }
  }

});

module.exports = Table;
