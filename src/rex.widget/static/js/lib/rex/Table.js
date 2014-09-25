/**
 * Simple table widget.
 *
 * @jsx React.DOM
 */
'use strict';

var React            = require('react/addons');
var PropTypes        = React.PropTypes;
var cx               = React.addons.classSet;
var Preloader        = require('../Preloader');
var WidgetPropTypes  = require('../PropTypes');
var ApplicationState = require('../ApplicationState');

var Table = React.createClass({

  propTypes: {
    data: WidgetPropTypes.Data.isRequired,
    columns: PropTypes.array.isRequired,
    calculatedColumns: PropTypes.array,
    calculatedRows: PropTypes.array,
    className: PropTypes.string,
    selectable: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  },

  render() {
    if (this.props.data.updating) {
      return <Preloader />;
    }
    var {columns, data: {data: rows}} = this.props;

    var calculatedColumns = this.props.calculatedColumns;
    var calculatedRows = this.props.calculatedRows

    var transposedData = {};
    return (
      <table className={cx('rw-Table', 'table', this.props.className)}>
        <thead>
          <tr>
            {columns.map((column) =>
              <th key={column.key}>{column.title || column.key}</th>
            )}
            {calculatedColumns.map((column) =>
              <th key={column.key} className="rw-Table__calculatedColumn">{column.title}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            var selected = (
              this.props.selectable &&
              this.props.selected == row.id &&
              row.id != null
            );
            var className=cx({
              'rw-Table__row': true,
              'rw-Table__row--selected': selected
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
                      {column.formatter ?
                        column.formatter(row[column.key], column.key, row, rowIndex) :
                        row[column.key]}
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
                    <td className="rw-Table__calculatedColumn" key={column.key}>
                      {column.formatter ?
                        column.formatter(value, column.key, row, rowIndex) :
                        value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {calculatedRows.map((row, rowIndex) =>
            <tr key={rowIndex} className="rw-Table__calculatedRow">
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
                  <td className="rw-Table__calculatedColumn" key={column.key}>
                    {column.formatter ? column.formatter(value, column.key, row) : value}
                  </td>
                )
              })}
            </tr>
          )}
        </tbody>
      </table>
    );
  },

  getDefaultProps() {
    return {
      calculatedColumns: [],
      calculatedRows: []
    }
  },

  onSelected(rowID) {
    if (this.props.selectable && rowID != this.props.selected) {
      this.props.onSelected(rowID);
    }
  }

});

module.exports = Table;

