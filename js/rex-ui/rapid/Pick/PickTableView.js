/**
 * @flow
 */

import * as React from "react";

import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";

import SwapVertIcon from "@material-ui/icons/SwapVert";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import * as Sort from "../Sort.js";
import SelectAllCheckbox from "../SelectAllCheckbox.js";
import { PickTableBody } from "./PickTableBody";
import { makeStyles, type Theme } from "../themes.js";
import { capitalize } from "../helpers";
import type { PickDataViewProps } from "./PickRenderer.js";

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
    root: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "0%",
      minHeight: 0,
      height: 0,
      position: "relative",
      display: "flex",
      flexDirection: "column",
    },
    scrollContainer: {
      overflowY: "scroll",
      minHeight: 0,
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: "0%",
    },
  };
});

export function PickTableView<O: { id: string, [key: string]: mixed }>({
  args,
  loading,
  data,
  fields,
  isTabletWidth,
  sorts,
  RenderColumnCell,
  RenderRow,
  RenderRowCell,
  onSelect,
  onSelectMany,
  showAs,
  selected,
  onSelected,
  params,
  onParams,
}: PickDataViewProps<O>) {
  let sort = Sort.getSort(params);
  let onSort = sort => onParams(params => Sort.setSort(params, sort));
  const classes = useDataViewStyles();

  const wrapperRef = React.useMemo(() => React.createRef(), []);

  const [isTableFullHeight, setTableFullHeight] = React.useState(false);

  React.useLayoutEffect(() => {
    if (wrapperRef.current != null) {
      wrapperRef.current.scrollTop = 0;
    }
  }, [wrapperRef]);

  const columnsMap = new Map();
  const columnsNames = [];
  // eslint-disable-next-line no-unused-vars
  for (let spec of fields) {
    columnsMap.set(spec.name, spec);
    columnsNames.push(spec.name);
  }

  const TableHeadColumns = columnsNames.map((columnName, index) => {
    const column = columnsMap.get(columnName);

    if (!column) {
      return null;
    }

    let cellClasses = `${classes.tableHead} `;
    let isSortable =
      sorts?.options.find(obj => obj.field === columnName) ?? false;

    if (isSortable) {
      cellClasses = `${cellClasses} ${classes.tableHeadSortable}`;
    }

    const isSortedAsc = sort && sort.field === columnName && !sort.desc;
    const isSortedDesc = sort && sort.field === columnName && sort.desc;

    if (isSortedAsc || isSortedDesc) {
      cellClasses = `${cellClasses} ${classes.tableHeadSorted}`;
    }

    const onTableHeadClick = () => {
      if (!isSortable) {
        return;
      }
      if (!isSortedAsc && !isSortedDesc) {
        onSort({ field: columnName, desc: true });
      }

      if (isSortedAsc) {
        onSort({ field: columnName, desc: true });
      }

      if (isSortedDesc) {
        onSort({ field: columnName, desc: false });
      }
    };

    const title = column.title || capitalize(columnName);

    const columnStyle = column.width ? { width: column.width } : undefined;

    return (
      <TableCell
        onClick={onTableHeadClick}
        align="left"
        key={columnName}
        className={cellClasses}
        variant={"head"}
        style={columnStyle}
        title={title}
      >
        {RenderColumnCell ? (
          <RenderColumnCell column={column} index={index} key={index} />
        ) : (
          <div className={classes.tableCellContentWrapper}>
            {title}

            <div className={classes.tableCellSortIcon}>
              {isSortedAsc ? (
                <ArrowUpwardIcon fontSize={"small"} />
              ) : isSortedDesc ? (
                <ArrowDownwardIcon fontSize={"small"} />
              ) : isSortable ? (
                <SwapVertIcon fontSize={"small"} />
              ) : null}
            </div>
          </div>
        )}
      </TableCell>
    );
  });
  let onCheckedAll = (ev: UIEvent) => {
    let checked = (ev.target: any).checked;
    let nextSelected = new Set(selected);
    if (checked) {
      data.forEach(row => {
        nextSelected.add(row.id);
      });
    } else {
      data.forEach(row => {
        nextSelected.delete(row.id);
      });
    }
    onSelected(nextSelected);
    if (onSelectMany) {
      onSelectMany(data.filter(row => nextSelected.has(row.id)));
    }
  };

  const tableClassNames = [classes.table];
  if (data.length === 0 || isTableFullHeight) {
    tableClassNames.push(classes.tableFullHeight);
  }

  return (
    <div className={classes.root}>
      <div className={classes.scrollContainer} ref={wrapperRef}>
        <Table
          className={tableClassNames.join(" ")}
          aria-label="simple table"
          padding={"dense"}
        >
          <TableHead>
            <TableRow>
              {onSelectMany && (
                <TableCell
                  padding="checkbox"
                  style={{
                    top: 0,
                    position: "sticky",
                    width: 64,
                    backgroundColor: "white",
                    zIndex: 1000,
                  }}
                >
                  <SelectAllCheckbox
                    onCheckedAll={onCheckedAll}
                    selected={selected}
                    data={data}
                  />
                </TableCell>
              )}
              {TableHeadColumns}
            </TableRow>
          </TableHead>

          <PickTableBody
            loading={loading}
            data={data}
            fields={fields}
            onSort={onSort}
            RenderColumnCell={RenderColumnCell}
            RenderRow={RenderRow}
            RenderRowCell={RenderRowCell}
            onSelect={onSelect}
            onSelectMany={onSelectMany}
            isTabletWidth={isTabletWidth}
            columnsMap={columnsMap}
            columnsNames={columnsNames}
            setTableFullHeight={setTableFullHeight}
            showAs={showAs}
            selected={selected}
            onSelected={onSelected}
          />
        </Table>
      </div>
    </div>
  );
}
