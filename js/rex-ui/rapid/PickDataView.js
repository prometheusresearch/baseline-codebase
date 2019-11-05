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
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";

import SwapVertIcon from "@material-ui/icons/SwapVert";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import {
  type Resource,
  unstable_useResource as useResource
} from "rex-graphql/Resource";
import _get from "lodash/get";

import { sortObjectFieldsWithPreferred, capitalize } from "./helpers";
import { ShowCard } from "./ShowRenderer.js";
import { useStyles } from "./PickStyles.js";
import { type PickRendererConfigProps } from "./PickRenderer.js";
import { RenderValue } from "./RenderValue.js";
import * as Field from "./Field.js";

const PickNoDataPlaceholder = () => {
  let classes = useStyles();
  return (
    <div className={classes.center}>
      <Typography variant={"caption"}>No data</Typography>
    </div>
  );
};

const PickCardListView = ({
  data,
  columns
}: {
  data: Array<any>,
  columns: Field.FieldSpec[]
}) => {
  const classes = useStyles();
  return (
    <div className={classes.tableWrapper}>
      {data.map((row, index) => {
        return (
          <div key={index}>
            <ShowCard title={null} data={row} columns={columns} />
          </div>
        );
      })}
    </div>
  );
};

const PickTableView = ({
  data,
  columns,
  sortingConfig,
  sortingState,
  setSortingState,
  RendererColumnCell,
  RendererRow,
  RendererRowCell,
  onRowClick
}: {|
  data: Array<any>,
  columns: Field.FieldSpec[],
  sortingConfig: Array<{| desc: boolean, field: string |}>,
  sortingState: void | {| desc: boolean, field: string |},
  setSortingState: (value: string) => void,
  ...PickRendererConfigProps
|}) => {
  const classes = useStyles();

  const columnsMap = new Map();
  const columnsNames = [];
  for (let column of columns) {
    columnsMap.set(column.require.field, column);
    columnsNames.push(column.require.field);
  }

  /**
   * TODO: Move out table headers from Suspense
   */
  const TableHeadRows = columnsNames.map((columnName, index) => {
    const column = columnsMap.get(columnName);

    if (!column) {
      return null;
    }

    let cellClasses = `${classes.tableHead} `;
    const isSortable = sortingConfig.find(obj => obj.field === columnName);

    if (isSortable) {
      cellClasses = `${cellClasses} ${classes.tableHeadSortable}`;
    }

    const isSortedAsc =
      sortingState && sortingState.field === columnName && !sortingState.desc;
    const isSortedDesc =
      sortingState && sortingState.field === columnName && sortingState.desc;

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

    return (
      <TableCell
        onClick={onTableHeadClick}
        align="left"
        key={columnName}
        className={cellClasses}
        variant={"head"}
      >
        {RendererColumnCell ? (
          <RendererColumnCell column={column} index={index} key={index} />
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

  const TableBodyRows = data.map((row, index) => {
    return (
      <TableRow
        key={index}
        hover={onRowClick != null}
        style={{ cursor: onRowClick != null ? "pointer" : "default" }}
        onClick={ev => (onRowClick != null ? onRowClick(row) : null)}
      >
        {columnsNames.map((columnName, index) => {
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
            >
              {column.render ? (
                <column.render value={value} />
              ) : (
                <RenderValue value={value} />
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );
  });

  return (
    <div className={classes.tableWrapper}>
      <Table
        className={classes.table}
        aria-label="simple table"
        padding={"dense"}
      >
        <TableHead>
          <TableRow>{TableHeadRows}</TableRow>
        </TableHead>
        <TableBody>{TableBodyRows}</TableBody>
      </Table>
    </div>
  );
};

export const PickDataView = ({
  onDataReceive,
  variableDefinitions,
  args,
  preparedFilterState,
  limit,
  offset,
  sortingState,
  searchState,
  resource,
  columns,
  fetch,
  isTabletWidth,
  sortingConfig,
  setSortingState,
  RendererColumnCell,
  RendererRow,
  RendererRowCell,
  onRowClick
}: {
  resource: Resource<any, any>,
  onDataReceive: any => any,
  columns: Field.FieldSpec[],
  args?: { [key: string]: any },
  variableDefinitions: $ReadOnlyArray<VariableDefinitionNode>,
  preparedFilterState: { [key: string]: any },
  limit: number,
  offset: number,
  sortingState: void | {| desc: boolean, field: string |},
  searchState: ?string,
  isTabletWidth: boolean,
  sortingConfig: Array<{| desc: boolean, field: string |}>,
  setSortingState: (value: string) => void,
  ...PickRendererConfigProps
}) => {
  const hasLimitVariable = variableDefinitions
    ? variableDefinitions.find(def => def.variable.name.value === "limit")
    : null;
  const hasOffsetVariable = variableDefinitions
    ? variableDefinitions.find(def => def.variable.name.value === "offset")
    : null;

  // Forming query params
  let gqlQueryParams = { ...args, ...preparedFilterState };
  if (hasLimitVariable != null) {
    gqlQueryParams = { ...gqlQueryParams, limit };
  }
  if (hasOffsetVariable != null) {
    gqlQueryParams = { ...gqlQueryParams, offset };
  }
  if (sortingState) {
    gqlQueryParams = {
      ...gqlQueryParams,
      sort: sortingState
    };
  }
  if (searchState) {
    gqlQueryParams = { ...gqlQueryParams, search: searchState };
  }

  const resourceData = useResource(resource, gqlQueryParams);

  if (resourceData == null || columns.length === 0) {
    return null;
  }

  const data = React.useMemo(() => {
    const data = _get(resourceData, fetch);
    onDataReceive(data);
    return data;
  }, [resourceData, fetch, onDataReceive]);

  if (data.length === 0) {
    return <PickNoDataPlaceholder />;
  }
  if (isTabletWidth) {
    return (
      <PickTableView
        data={data}
        columns={columns}
        sortingConfig={sortingConfig}
        sortingState={sortingState}
        setSortingState={setSortingState}
        RendererColumnCell={RendererColumnCell}
        RendererRow={RendererRow}
        RendererRowCell={RendererRowCell}
        onRowClick={onRowClick}
        fetch={fetch}
      />
    );
  }

  return <PickCardListView data={data} columns={columns} />;
};
