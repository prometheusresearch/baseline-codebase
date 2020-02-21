/**
 * @flow
 */

import * as React from "react";

import Typography from "@material-ui/core/Typography";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import Checkbox from "@material-ui/core/Checkbox";
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";
import Grid from "@material-ui/core/Grid";

import SwapVertIcon from "@material-ui/icons/SwapVert";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import { type Endpoint } from "rex-graphql";
import { type Resource, useResource } from "rex-graphql/Resource2";
import _get from "lodash/get";

import { ShowCard } from "./ShowRenderer.js";
import { type PickRendererConfigProps } from "./PickRenderer.js";
import { RenderValue } from "./RenderValue.js";
import * as Field from "./Field.js";
import { type PickState } from "./PickRenderer";
import { LoadingIndicator } from "./LoadingIndicator";

import { makeStyles, type Theme } from "@material-ui/styles";
import { DEFAULT_THEME } from "./themes";
import { isEmptyObject, capitalize } from "./helpers";

const useDataViewStyles = makeStyles((theme: Theme) => {
  if (theme.palette == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
    center: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    table: {
      minWidth: "100%",
      tableLayout: "fixed",
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
    tableWrapper: {
      overflowY: "scroll",
      flex: "1 1 auto",
    },
  };
});

const PickNoDataPlaceholder = ({
  fieldSpecs,
}: {
  fieldSpecs: { [name: string]: Field.FieldSpec },
}) => {
  let classes = useDataViewStyles();

  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={Object.keys(fieldSpecs).length + 1}>
          <div className={classes.center}>
            <Typography variant={"caption"}>No data</Typography>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

const PickCardListView = ({
  data,
  fieldSpecs,
  onClick,
}: {|
  data: Array<any>,
  fieldSpecs: { [name: string]: Field.FieldSpec },
  onClick?: (row: any) => void,
|}) => {
  return (
    <Grid container>
      {data.map((row, index) => {
        return (
          <Grid
            key={index}
            item
            xs={12}
            md={6}
            lg={4}
            style={{ padding: "0 8px" }}
          >
            <div>
              <ShowCard
                onClick={onClick ? () => onClick(row) : undefined}
                title={null}
                data={row}
                fieldSpecs={fieldSpecs}
              />
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
};

const PickTableBody = ({
  fieldSpecs,
  sortingConfig,
  setSortingState,
  RenderColumnCell,
  RenderRow,
  RenderRowCell,
  onRowClick,
  isTabletWidth,
  columnsNames,
  columnsMap,
  pickState,
  endpoint,
  resource,
  fetch,
  onDataReceive,
  setTableFullHeight,
  selected,
  onSelected,
  showAs,
}: {|
  fieldSpecs: { [name: string]: Field.FieldSpec },
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setSortingState: (value: string) => void,
  isTabletWidth: boolean,
  columnsNames: string[],
  columnsMap: Map<string, Field.FieldSpec>,
  pickState: PickState,
  endpoint: Endpoint,
  resource: Resource<any, any>,
  fetch: string,
  onDataReceive: any => void,
  setTableFullHeight: (is: boolean) => void,

  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,

  ...PickRendererConfigProps,
|}) => {
  const classes = useDataViewStyles();

  const params = buildParams(pickState);

  setTableFullHeight(true);
  const [, resourceData] = useResource(endpoint, resource, params);
  setTableFullHeight(false);

  if (resourceData == null) {
    return null;
  }

  const data = React.useMemo(() => {
    const data = _get(resourceData, fetch);
    /**
     * Used for pagination to have idea if received date length equal to limit
     * to know if incremention of page is allowed
     */
    onDataReceive(data);
    const dataTrimmed =
      data.length < pickState.limit ? data : data.slice(0, data.length - 1);
    return dataTrimmed;
  }, [resourceData, fetch, onDataReceive, pickState]);

  if (data.length === 0) {
    return <PickNoDataPlaceholder fieldSpecs={fieldSpecs} />;
  }

  if ((!isTabletWidth && showAs !== "table") || showAs === "card-list") {
    return (
      <TableBody>
        <TableRow>
          <TableCell style={{ padding: 0 }}>
            <PickCardListView
              onClick={onRowClick}
              data={data}
              fieldSpecs={fieldSpecs}
            />
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  let rows = data.map((row, index) => {
    const isClickable = onRowClick != null;

    let classNames = [classes.tableRow];
    if (isClickable) {
      classNames.push(classes.tableRowClickable);
    }

    let cells = columnsNames.map((columnName, index) => {
      const column = columnsMap.get(columnName);

      if (!column) {
        return null;
      }
      let value = row[columnName];

      return (
        <TableCell
          key={columnName}
          align="left"
          variant={"head"}
          className={classes.tableCell}
          title={RenderValue({ value })}
        >
          {column.render != null ? (
            <column.render value={value} />
          ) : (
            <span>{RenderValue({ value })}</span>
          )}
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
    };

    let onClick = (ev: UIEvent) => {
      ev.stopPropagation();
    };

    return (
      <TableRow
        key={index}
        hover={isClickable}
        style={{ cursor: isClickable ? "pointer" : "default" }}
        onClick={ev => (onRowClick != null ? onRowClick(row) : null)}
        className={classNames.join(" ")}
      >
        <TableCell padding="checkbox" style={{ width: 64 }}>
          <Checkbox
            onClick={onClick}
            onChange={onChecked}
            checked={selected.has(row.id)}
          />
        </TableCell>
        {cells}
      </TableRow>
    );
  });

  return <TableBody>{rows}</TableBody>;
};

const buildParams = (pickState: PickState) => {
  const { filter, limit, offset, search, sort } = pickState;
  let params = { ...filter, limit, offset };

  if (sort) {
    params = {
      ...params,
      sort,
    };
  }
  if (search) {
    params = { ...params, search };
  }

  return params;
};

export const PickDataView = ({
  onDataReceive: _onDataReceive,
  args,
  endpoint,
  resource,
  fieldSpecs,
  fetch,
  isTabletWidth,
  sortingConfig,
  setSortingState,
  RenderColumnCell,
  RenderRow,
  RenderRowCell,
  onRowClick,
  state,
  showAs,
  selected,
  onSelected,
}: {|
  endpoint: Endpoint,
  resource: Resource<any, any>,
  onDataReceive: any => any,
  fieldSpecs: { [name: string]: Field.FieldSpec },
  args?: { [key: string]: any },
  isTabletWidth: boolean,
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setSortingState: (value: string) => void,
  state: PickState,

  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,

  ...PickRendererConfigProps,
|}) => {
  const classes = useDataViewStyles();

  const wrapperRef = React.useMemo(() => React.createRef(), []);

  const [isTableFullHeight, setTableFullHeight] = React.useState(false);
  const [data, setData] = React.useState([]);
  const onDataReceive = React.useMemo(
    () => data => {
      _onDataReceive(data);
      setData(data);
    },
    [_onDataReceive],
  );

  React.useLayoutEffect(() => {
    if (wrapperRef.current != null) {
      wrapperRef.current.scrollTop = 0;
    }
  }, [state]);

  const columnsMap = new Map();
  const columnsNames = [];
  for (let name in fieldSpecs) {
    let spec = fieldSpecs[name];
    columnsMap.set(spec.require.field, spec);
    columnsNames.push(spec.require.field);
  }

  const TableHeadRows = columnsNames.map((columnName, index) => {
    const column = columnsMap.get(columnName);

    if (!column) {
      return null;
    }

    let cellClasses = `${classes.tableHead} `;
    const isSortable =
      sortingConfig != null &&
      sortingConfig.find(obj => obj.field === columnName);

    if (isSortable) {
      cellClasses = `${cellClasses} ${classes.tableHeadSortable}`;
    }

    const isSortedAsc =
      state.sort && state.sort.field === columnName && !state.sort.desc;
    const isSortedDesc =
      state.sort && state.sort.field === columnName && state.sort.desc;

    if (isSortedAsc || isSortedDesc) {
      cellClasses = `${cellClasses} ${classes.tableHeadSorted}`;
    }

    const onTableHeadClick = () => {
      if (!isSortable) {
        return;
      }
      if (!isSortedAsc && !isSortedDesc) {
        setSortingState(JSON.stringify({ field: columnName, desc: true }));
      }

      if (isSortedAsc) {
        setSortingState(JSON.stringify({ field: columnName, desc: true }));
      }

      if (isSortedDesc) {
        setSortingState(JSON.stringify({ field: columnName, desc: false }));
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

  const tableClassNames = [classes.table];
  if (data.length === 0 || isTableFullHeight) {
    tableClassNames.push(classes.tableFullHeight);
  }

  return (
    <div className={classes.tableWrapper} ref={wrapperRef}>
      <Table
        className={tableClassNames.join(" ")}
        aria-label="simple table"
        padding={"dense"}
      >
        {(isTabletWidth && showAs !== "card-list") || showAs === "table" ? (
          <TableHead>
            <TableRow>
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
                {" "}
              </TableCell>
              {TableHeadRows}
            </TableRow>
          </TableHead>
        ) : null}

        <React.Suspense
          fallback={
            <TableBody>
              <TableRow>
                <TableCell colSpan={Object.keys(fieldSpecs).length + 1}>
                  <div className={classes.center}>
                    <LoadingIndicator />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          }
        >
          <PickTableBody
            pickState={state}
            onDataReceive={onDataReceive}
            endpoint={endpoint}
            resource={resource}
            fieldSpecs={fieldSpecs}
            sortingConfig={sortingConfig}
            setSortingState={setSortingState}
            RenderColumnCell={RenderColumnCell}
            RenderRow={RenderRow}
            RenderRowCell={RenderRowCell}
            onRowClick={onRowClick}
            fetch={fetch}
            isTabletWidth={isTabletWidth}
            columnsMap={columnsMap}
            columnsNames={columnsNames}
            setTableFullHeight={setTableFullHeight}
            showAs={showAs}
            selected={selected}
            onSelected={onSelected}
          />
        </React.Suspense>
      </Table>
    </div>
  );
};
