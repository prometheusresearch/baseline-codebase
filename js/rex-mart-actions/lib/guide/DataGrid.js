/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid } from "react-window";
import moment from "moment";

const HEADER_HEIGHT = 30;
const CELL_HEIGHT = 40;

class DataGridHeaderCell extends React.Component {
  render() {
    let { column } = this.props;
    let style = {
      ...this.props.style,
      boxSizing: "border-box",
      fontWeight: "bold",
      borderRight: "1px solid #ccc",
      borderBottom: "1px solid #ccc",
      textTransform: "uppercase",
      fontSize: 10,
      fontWeight: "bold",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      color: "#888",
      lineHeight: HEADER_HEIGHT - 2 + "px",
      padding: "0 10px",
      backgroundColor: "white",
      cursor: "pointer"
    };

    let sort;
    if (column.sort === "asc") {
      sort = "▲";
    } else if (column.sort === "desc") {
      sort = "▼";
    }

    return (
      <div
        onClick={column.onClick}
        title={`${column.title} (${column.type})`}
        style={style}
      >
        {sort && <span style={{ paddingRight: "1ch" }}>{sort}</span>}
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
          textAlign: "center",
          color: "#bbb"
        }}
      >
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
          whiteSpace: "nowrap",
          fontFamily: "monospace",
          textOverflow: "ellipsis",
          overflow: "hidden",
          maxWidth: "200px"
        }}
      >
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
          whiteSpace: "nowrap"
        }}
      >
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
          textAlign: "center",
          color: this.props.value ? "green" : "red"
        }}
      >
        <span>{this.props.value ? "✓" : "✗"}</span>
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
          textAlign: "right"
        }}
      >
        <span>{value}</span>
      </div>
    );
  }
}

class DateValue extends React.Component {
  static displayFormat = "YYYY-MM-DD";
  static parseFormat = "YYYY-MM-DD";

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
          textAlign: "right",
          whiteSpace: "nowrap"
        }}
      >
        <span>{value}</span>
      </div>
    );
  }
}

class TimeValue extends DateValue {
  static displayFormat = "HH:mm:ss";
  static parseFormat = "HH:mm:ss";
}

class DateTimeValue extends DateValue {
  static displayFormat = "YYYY-MM-DD HH:mm:ss";
  static parseFormat = "YYYY-MM-DD HH:mm:ss";
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
  json: JsonValue
};

class DataGridCell extends React.Component {
  render() {
    let style = {
      ...this.props.style,
      overflow: "hidden",
      lineHeight: CELL_HEIGHT - 2 + "px",
      padding: "0 10px",
      fontSize: "0.9em",
      boxSizing: "border-box",
      borderRight: "1px solid #ccc",
      borderBottom: "1px solid #ccc"
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

    return <div style={style}>{value}</div>;
  }
}

let DataGrid = props => {
  let rowCount = props.rows.length;

  let columnCount = props.columns.length;
  let columnWidth = 120;

  // The 33 is the height of the tabs of the parent, for unknown reason,
  // AutoSizer isn't excluding that in its math
  let heightOffset = 33;

  let header = React.useRef();

  let onScroll = ({ scrollTop, scrollLeft }) => {
    if (header.current) {
      header.current.scrollTo({ scrollLeft });
    }
  };

  let Cell = ({ columnIndex, rowIndex, style }) => {
    let key = `${rowIndex}:${columnIndex}`;
    return (
      <DataGridCell
        key={key}
        style={style}
        column={props.columns[columnIndex]}
        value={props.rows[rowIndex][columnIndex]}
      />
    );
  };

  let HeaderCell = ({ columnIndex, rowIndex, style }) => {
    let key = `${rowIndex}:${columnIndex}`;
    return (
      <DataGridHeaderCell
        key={key}
        style={style}
        column={props.columns[columnIndex]}
      />
    );
  };

  return (
    <div style={{ flexGrow: 1 }}>
      <AutoSizer>
        {({ height, width }) => (
          <>
            <Grid
              style={{ overflowX: "hidden" }}
              ref={header}
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={1}
              rowHeight={HEADER_HEIGHT}
              height={HEADER_HEIGHT}
              width={width}
            >
              {HeaderCell}
            </Grid>
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={CELL_HEIGHT}
              height={height - HEADER_HEIGHT}
              width={width}
              onScroll={onScroll}
            >
              {Cell}
            </Grid>
          </>
        )}
      </AutoSizer>
    </div>
  );
};

export default DataGrid;
