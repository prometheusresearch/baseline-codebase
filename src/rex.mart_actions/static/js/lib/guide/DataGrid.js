/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import {MultiGrid, AutoSizer, CellMeasurer} from 'react-virtualized';
import moment from 'moment';

const HEADER_HEIGHT = 30;
const CELL_HEIGHT = 40;

class DataGridHeaderCell extends React.Component {
  render() {
    let {column} = this.props;
    let style = {
      ...this.props.style,
      boxSizing: 'border-box',
      fontWeight: 'bold',
      borderRight: '1px solid #ccc',
      borderBottom: '1px solid #ccc',
      textTransform: 'uppercase',
      fontSize: 10,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      color: '#888',
      lineHeight: HEADER_HEIGHT - 2 + 'px',
      padding: '0 10px',
      backgroundColor: 'white',
      cursor: 'pointer',
    };

    let sort;
    if (column.sort === 'asc') {
      sort = '▲';
    } else if (column.sort === 'desc') {
      sort = '▼';
    }

    return (
      <div
        onClick={column.onClick}
        title={`${column.title} (${column.type})`}
        style={style}>
        {sort &&
          <span style={{paddingRight: '1ch'}}>
            {sort}
          </span>}
        {column.title}
      </div>
    );
  }
}

class NullValue extends React.Component {
  render() {
    return (
      <div
        style={{
          textAlign: 'center',
          color: '#bbb',
        }}>
        <span>-</span>
      </div>
    );
  }
}

class JsonValue extends React.Component {
  render() {
    let value = JSON.stringify(this.props.value);

    return (
      <div
        title={value}
        style={{
          whiteSpace: 'nowrap',
          fontFamily: 'monospace',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          maxWidth: '200px',
        }}>
        {value}
      </div>
    );
  }
}

class TextValue extends React.Component {
  render() {
    return (
      <div
        style={{
          whiteSpace: 'nowrap',
        }}>
        {this.props.value}
      </div>
    );
  }
}

class BooleanValue extends React.Component {
  render() {
    return (
      <div
        style={{
          textAlign: 'center',
          color: this.props.value ? 'green' : 'red',
        }}>
        <span>
          {this.props.value ? '✓' : '✗'}
        </span>
      </div>
    );
  }
}

class NumericValue extends React.Component {
  render() {
    let value = new Intl.NumberFormat().format(this.props.value);

    return (
      <div
        style={{
          textAlign: 'right',
        }}>
        <span>
          {value}
        </span>
      </div>
    );
  }
}

class DateValue extends React.Component {
  static displayFormat = 'YYYY-MM-DD';
  static parseFormat = 'YYYY-MM-DD';

  render() {
    // HTSQL currently returns the value in roughly the format we
    // want, so don't waste cycles using moment to parse and reformat
    // the string.
    /*let value = moment(
      this.props.value,
      this.constructor.parseFormat,
    ).format(this.constructor.displayFormat);*/

    let value = this.props.value.substr(0, this.constructor.parseFormat.length);

    return (
      <div
        style={{
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}>
        <span>
          {value}
        </span>
      </div>
    );
  }
}

class TimeValue extends DateValue {
  static displayFormat = 'HH:mm:ss';
  static parseFormat = 'HH:mm:ss';
}

class DateTimeValue extends DateValue {
  static displayFormat = 'YYYY-MM-DD HH:mm:ss';
  static parseFormat = 'YYYY-MM-DD HH:mm:ss';
}

let VALUE_COMPONENTS = {
  text: TextValue,
  enum: TextValue,
  integer: NumericValue,
  float: NumericValue,
  decimal: NumericValue,
  boolean: BooleanValue,
  date: DateValue,
  time: TimeValue,
  datetime: DateTimeValue,
  json: JsonValue,
};

class DataGridCell extends React.Component {
  render() {
    let style = {
      ...this.props.style,
      lineHeight: CELL_HEIGHT - 2 + 'px',
      padding: '0 10px',
      fontSize: '0.9em',
      boxSizing: 'border-box',
      borderRight: '1px solid #ccc',
      borderBottom: '1px solid #ccc',
    };

    let value;
    if (this.props.value == null) {
      value = <NullValue />;
    } else {
      let Value = VALUE_COMPONENTS[this.props.column.type];
      if (!Value) {
        Value = TextValue;
      }
      value = <Value value={this.props.value} />;
    }

    return (
      <div style={style}>
        {value}
      </div>
    );
  }
}

export default class DataGrid extends React.Component {
  cellRenderer({columnIndex, key, rowIndex, style}) {
    if (rowIndex === 0) {
      return (
        <DataGridHeaderCell
          key={key}
          style={style}
          column={this.props.columns[columnIndex]}
        />
      );
    } else {
      return (
        <DataGridCell
          key={key}
          style={style}
          column={this.props.columns[columnIndex]}
          value={this.props.rows[rowIndex - 1][columnIndex]}
        />
      );
    }
  }

  render() {
    let columnCount = this.props.columns.length;
    let rowCount = this.props.rows.length + 1;
    let rowHeight = ({index}) => (index === 0 ? HEADER_HEIGHT : CELL_HEIGHT);

    let self = this;
    return (
      <AutoSizer>
        {({height, width}) =>
          <CellMeasurer
            cellRenderer={self.cellRenderer.bind(self)}
            columnCount={columnCount}
            height={rowHeight(0)}
            rowCount={rowCount}>
            {({getColumnWidth}) =>
              <MultiGrid
                height={height - 33} // The 33 is the height of the tabs of the parent, for unknown reason, AutoSizer isn't excluding that in its math
                width={width}
                cellRenderer={self.cellRenderer.bind(self)}
                columnCount={columnCount}
                fixedColumnCount={0}
                columnWidth={getColumnWidth}
                rowCount={rowCount}
                fixedRowCount={1}
                rowHeight={rowHeight}
                styleTopRightGrid={{
                  backgroundColor: '#f5f5f5',
                }}
              />}
          </CellMeasurer>}
      </AutoSizer>
    );
  }
}
