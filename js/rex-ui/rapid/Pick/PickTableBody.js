// @flow

import * as React from "react";

import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Checkbox from "@material-ui/core/Checkbox";

import { type Theme, makeStyles } from "../themes";
import { RenderValue } from "../RenderValue.js";
import * as Field from "../Field";
import type { PickRendererConfigProps } from "./PickRenderer";
import type { SortDirection } from "../Sort.js";
import { PickPlaceholder } from "./PickPlaceholder";

const useDataViewStyles = makeStyles((theme: Theme) => {
  return {
    table: {
      minWidth: "100%",
      tableLayout: "fixed",
      borderCollapse: "separate",
    },
    tableFullHeight: {
      minHeight: "100%",
    },
    tableCell: {
      color: "inherit",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    tableCellContentWrapper: {
      paddingRight: 24,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    tableCellSortIcon: {
      position: "absolute",
      top: 16,
      right: 6,
    },
    tableHead: {
      background: "white",
      position: "sticky",
      top: 0,
      color: "inherit",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
    tableHeadSortable: {
      cursor: "pointer",
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        color: "white",
      },
    },
    tableHeadSorted: {
      backgroundColor: theme.palette.primary.main,
      color: "white",
    },
    tableRow: {
      color: theme.palette.text.primary,
    },
    tableRowClickable: {
      "&&&:hover": {
        background: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
      },
    },
  };
});

export function PickTableBody<O: { id: string, [key: string]: mixed }>({
  data,
  fields,
  onSort,
  RenderColumnCell,
  RenderRow,
  RenderRowCell,
  onSelect,
  onSelectMany,
  isTabletWidth,
  columnsNames,
  columnsMap,
  setTableFullHeight,
  selected,
  onSelected,
  showAs,
}: {|
  loading: boolean,
  data: Array<O>,
  fields: Field.FieldSpec[],
  onSort: (?SortDirection) => void,
  isTabletWidth: boolean,
  columnsNames: string[],
  columnsMap: Map<string, Field.FieldSpec>,
  setTableFullHeight: (is: boolean) => void,

  selected: Set<mixed>,
  onSelected: (nextSelected: Set<mixed>) => void,

  ...PickRendererConfigProps<>,
|}) {
  const classes = useDataViewStyles();

  if (data.length === 0) {
    return <PickPlaceholder colSpan={fields.length} />;
  }

  let rows = data.map((row, index) => {
    const isClickable = onSelect != null || onSelectMany != null;

    let classNames = [classes.tableRow];
    if (isClickable) {
      classNames.push(classes.tableRowClickable);
    }

    let cells = columnsNames.map((columnName, index) => {
      const column = columnsMap.get(columnName);

      if (!column) {
        return null;
      }

      let value = Field.extract(column, row);

      return (
        <TableCell
          key={columnName}
          align="left"
          variant={"head"}
          className={classes.tableCell}
          title={RenderValue({ value })}
        >
          {Field.render(column, row, value)}
        </TableCell>
      );
    });

    let onChecked = (ev: UIEvent) => {
      let checked = (ev.target: any).checked;
      let nextSelected = new Set(selected);
      if (checked) {
        nextSelected.add(row.id);
      } else {
        nextSelected.delete(row.id);
      }
      onSelected(nextSelected);
      let rows = data.filter(row => nextSelected.has(row.id));
      onSelectMany != null && onSelectMany(rows);
    };

    let onClick = (ev: UIEvent) => {
      ev.stopPropagation();
    };

    let onRowClick = (_event: UIEvent) => {
      if (onSelect != null) {
        onSelect(row);
      } else if (onSelectMany != null) {
        let checked = !selected.has(row.id);
        let nextSelected = new Set(selected);
        if (checked) {
          nextSelected.add(row.id);
        } else {
          nextSelected.delete(row.id);
        }
        onSelected(nextSelected);
        let rows = data.filter(row => nextSelected.has(row.id));
        onSelectMany(rows);
      }
    };

    return (
      <TableRow
        key={index}
        hover={isClickable}
        style={{ cursor: isClickable ? "pointer" : "default" }}
        onClick={onRowClick}
        className={classNames.join(" ")}
      >
        {onSelectMany && (
          <TableCell padding="checkbox" style={{ width: 64 }}>
            <Checkbox
              onClick={onClick}
              onChange={onChecked}
              checked={selected.has(row.id)}
            />
          </TableCell>
        )}
        {cells}
      </TableRow>
    );
  });

  return <TableBody>{rows}</TableBody>;
}
