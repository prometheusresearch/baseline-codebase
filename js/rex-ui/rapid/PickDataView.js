/**
 * @flow
 */

import * as React from "react";

import { type VariableDefinitionNode } from "graphql/language/ast";

import Typography from "@material-ui/core/Typography";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from "@material-ui/core/Checkbox";
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import Grid from "@material-ui/core/Grid";
import { useTheme } from "@material-ui/styles";

import SwapVertIcon from "@material-ui/icons/SwapVert";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import {
  type Resource,
  unstable_useResource as useResource,
} from "rex-graphql/Resource";
import _get from "lodash/get";

import { capitalize } from "./helpers";
import { ShowCard } from "./ShowRenderer.js";
import { usePickStyles } from "./styles.js";
import { type PickRendererConfigProps } from "./PickRenderer.js";
import { RenderValue } from "./RenderValue.js";
import * as Field from "./Field.js";
import { type PickState } from "./PickRenderer";
import { LoadingIndicator } from "./LoadingIndicator";
import { MuiThemeProvider } from "@material-ui/core";

const PickNoDataPlaceholder = ({ columns }: { columns: Field.FieldSpec[] }) => {
  let classes = usePickStyles();
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns.length + 1}>
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
  columns,
  onCardClick,
}: {|
  data: Array<any>,
  columns: Field.FieldSpec[],
  onCardClick?: (row: any) => void,
|}) => {
  const classes = usePickStyles();

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
                onCardClick={onCardClick ? () => onCardClick(row) : undefined}
                title={null}
                data={row}
                columns={columns}
              />
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
};

const PickTableBody = ({
  columns,
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
  resource,
  fetch,
  onDataReceive,
  setTableFullHeight,
  selected,
  onSelected,
  showAs,
}: {|
  columns: Field.FieldSpec[],
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setSortingState: (value: string) => void,
  isTabletWidth: boolean,
  columnsNames: string[],
  columnsMap: Map<string, Field.FieldSpec>,
  pickState: PickState,
  resource: Resource<any, any>,
  fetch: string,
  onDataReceive: any => void,
  setTableFullHeight: (is: boolean) => void,

  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,

  ...PickRendererConfigProps,
|}) => {
  const classes = usePickStyles();

  const params = buildParams(pickState);

  setTableFullHeight(true);
  const resourceData = useResource(resource, params);
  setTableFullHeight(false);

  if (resourceData == null || columns.length === 0) {
    return null;
  }

  const data = React.useMemo(() => {
    const data = _get(resourceData, fetch);
    /**
     * Used for pagination to have idea if received date length equal to limit
     * to know if incremention of page is allowed
     */
    onDataReceive(data);
    const dataTrimmed = data.slice(0, data.length - 1);
    return dataTrimmed;
  }, [resourceData, fetch, onDataReceive]);

  if (data.length === 0) {
    return <PickNoDataPlaceholder columns={columns} />;
  }

  if ((!isTabletWidth && showAs !== "table") || showAs === "card-list") {
    return (
      <TableBody>
        <TableRow>
          <TableCell style={{ padding: 0 }}>
            <PickCardListView
              onCardClick={onRowClick}
              data={data}
              columns={columns}
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
  variableDefinitions,
  args,
  resource,
  columns,
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
  columnsWidth,
  selected,
  onSelected,
}: {|
  resource: Resource<any, any>,
  onDataReceive: any => any,
  columns: Field.FieldSpec[],
  args?: { [key: string]: any },
  variableDefinitions: $ReadOnlyArray<VariableDefinitionNode>,
  isTabletWidth: boolean,
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setSortingState: (value: string) => void,
  state: PickState,

  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,

  ...PickRendererConfigProps,
|}) => {
  const classes = usePickStyles();

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
  for (let column of columns) {
    columnsMap.set(column.require.field, column);
    columnsNames.push(column.require.field);
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

    const columnStyle =
      columnsWidth && columnsWidth[columnName]
        ? { width: columnsWidth[columnName] }
        : undefined;

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

  const theme = useTheme();

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
                <TableCell colSpan={columns.length + 1}>
                  <div className={classes.center}>
                    <LoadingIndicator />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          }
        >
          <MuiThemeProvider theme={theme}>
            <PickTableBody
              pickState={state}
              onDataReceive={onDataReceive}
              resource={resource}
              columns={columns}
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
          </MuiThemeProvider>
        </React.Suspense>
      </Table>
    </div>
  );
};
