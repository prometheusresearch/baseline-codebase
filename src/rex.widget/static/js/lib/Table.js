/**
 * Simple table widget.
 *
 * @jsx React.DOM
 */
'use strict';

var React            = require('react/addons');
var PropTypes        = React.PropTypes;
var cx               = React.addons.classSet;
var Preloader        = require('./Preloader');
var WidgetPropTypes  = require('./PropTypes');
var runtime          = require('./runtime');

var AUTO_SELECT = {
  TRUE: true,
  FALSE: false,
  ON_DATA_UPDATE: 'on_data_update'
};

function getValueByKey(row, key) {
  var len = key.length;
  if (len === 1) {
    return row[key[0]];
  } else if (len === 2) {
    return row[key[0]][key[1]];
  } else if (len === 3) {
    return row[key[0]][key[1]][key[2]];
  } else {
    var val = row;
    for (var i = 0; i < len; i++) {
      val = val[key[i]];
    }
    return val;
  }
}

var Table = React.createClass({

  propTypes: {
    data: WidgetPropTypes.Data.isRequired,
    columns: PropTypes.array.isRequired,
    calculatedColumns: PropTypes.array,
    calculatedRows: PropTypes.array,
    className: PropTypes.string,
    selectable: PropTypes.bool,
    autoSelect: PropTypes.bool,
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  },

  render() {
    if (!this._dataLoaded()) {
      return <Preloader />;
    }
    var columns = this.props.columns
    var rows = this.props.data.data

    var calculatedColumns = this.props.calculatedColumns;
    var calculatedRows = this.props.calculatedRows

    var transposedData = {};
    return (
      <table className={cx('rw-Table', this.props.className)}>
        <thead>
          <tr>
            {columns.map((column) =>
              <th key={column.key}>{column.title}</th>
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
              this.props.selected !== undefined &&
              row.id !== undefined &&
              this.props.selected == row.id
            );
            var className=cx({
              'rw-Table__row': true,
              'rw-Table__row--selected': selected
            });
            return (
              <tr className={className} onClick={this.onSelected.bind(null, row.id)} key={rowIndex}>
                {columns.map((column) => {
                  var value = getValueByKey(row, column.key);
                  if (typeof value === 'boolean') {
                    value = value.toString();
                  }
                  if (transposedData[column.key] === undefined) {
                    transposedData[column.key] = [value];
                  } else {
                    transposedData[column.key].push(value);
                  }
                  return (
                    <td key={column.key}>
                      {column.formatter ?
                        column.formatter(value, column.key, row, rowIndex) :
                        value}
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

  _dataLoaded(props) {
    props = props || this.props;
    var {data} = this.props;
    return data !== null && !data.updating;
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
    if (this.props.onSelect) {
      this.props.onSelect();
    }
  },

  componentDidMount() {
    this.checkAutoSelect(true);
  },

  componentDidUpdate(prevProps) {
    this.checkAutoSelect(!this._dataLoaded(prevProps) && this._dataLoaded());
  },

  /**
   * Check if need to autoselect the first row of the table.
   *
   * @param {Boolean} dataUpdated If data was just updated
   */
  checkAutoSelect(dataUpdated) {
    var {autoSelect, selected, selectable} = this.props;
    if (!selectable) {
      return;
    }
    if (
      (autoSelect === AUTO_SELECT.TRUE && selected === null) ||
      (autoSelect === AUTO_SELECT.ON_DATA_UPDATE && dataUpdated)
    ) {
      var firstRow = this.props.data.data[0];
      if (firstRow) {
        this.props.onSelected(firstRow.id, {persistence: runtime.ApplicationState.PERSISTENCE.INVISIBLE});
      }
    }
  }

});

module.exports = Table;
module.exports.AUTO_SELECT = AUTO_SELECT;
