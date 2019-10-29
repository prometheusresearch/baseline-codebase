/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import {
  type DocumentNode,
  type FieldNode,
  type OperationDefinitionNode,
  type VariableDefinitionNode
} from "graphql/language/ast";

import { makeStyles, useTheme } from "@material-ui/styles";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import DeleteIcon from "@material-ui/icons/Delete";
import FormGroup from "@material-ui/core/FormGroup";
import IconButton from "@material-ui/core/IconButton";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import _get from "lodash/get";

import {
  type Resource,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import { withResourceErrorCatcher, calculateItemsLimit } from "./helpers";

import { ComponentLoading } from "./component.loading";
import { ShowRenderer, ShowCard } from "./show.renderer";

import { type PropsSharedWithRenderer } from "./pick";

type CustomRendererProps = { resource: Resource<any, any> };

export type TypePropsRenderer = {|
  resource: Resource<any, any>,
  Renderer?: React.ComponentType<CustomRendererProps>,

  ast: DocumentNode,
  columns: FieldNode[],
  catcher: (err: Error) => void,
  ...PropsSharedWithRenderer
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  },
  table: {
    minWidth: 720
  },
  tableControl: {
    padding: "16px"
  },
  formControl: {
    minWidth: 120
  }
});

const TableFilters = ({
  variableDefinitions,
  filterState,
  setFilterState
}: {|
  variableDefinitions: VariableDefinitionNode[] | void,
  filterState: { [key: string]: boolean },
  setFilterState: (varDefName: string, value: boolean) => void
|}) => {
  const classes = useStyles();

  if (variableDefinitions == null) {
    return null;
  }

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      spacing={8}
      className={classes.tableControl}
    >
      <Grid item>
        <FormGroup row>
          {variableDefinitions
            .filter(varDef => {
              // Get only Boolean vars
              // $FlowFixMe
              const value = varDef.type.name
                ? varDef.type.name.value
                : undefined;
              return value === "Boolean";
            })
            .map(varDef => {
              const booleanFilterName = varDef.variable.name.value;

              return (
                <FormControl
                  key={`boolean-filter-${booleanFilterName}`}
                  className={classes.formControl}
                >
                  <InputLabel htmlFor={`boolean-filter-${booleanFilterName}`}>
                    {booleanFilterName}
                  </InputLabel>
                  <Select
                    value={
                      filterState[booleanFilterName] === undefined
                        ? "undefined"
                        : filterState[booleanFilterName]
                    }
                    onChange={ev => {
                      setFilterState(booleanFilterName, ev.target.value);
                    }}
                    inputProps={{
                      name: `boolean-filter-${booleanFilterName}`
                    }}
                  >
                    <MenuItem value={"undefined"}></MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              );
            })}
        </FormGroup>
      </Grid>
    </Grid>
  );
};

const TablePagination = ({
  data,
  limit,
  offset,
  decrementPage,
  incrementPage
}: {|
  data: any,
  limit: number,
  offset: number,
  decrementPage: () => void,
  incrementPage: () => void
|}) => {
  const classes = useStyles();

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      spacing={8}
      className={classes.tableControl}
    >
      <Grid item>
        <IconButton
          aria-label="previous"
          color="default"
          onClick={decrementPage}
          disabled={offset === 0}
        >
          <ChevronLeftIcon />
        </IconButton>

        <IconButton
          aria-label="next"
          color="default"
          onClick={incrementPage}
          disabled={data.length < limit}
        >
          <ChevronRightIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

const containerRef = React.createRef();

export const PickRenderer = ({
  resource,
  Renderer,
  catcher,
  columns,
  fetch,
  ast,
  RendererColumnCell,
  RendererRowCell,
  RendererRow,
  isRowClickable,
  onRowClick
}: TypePropsRenderer) => {
  const [offset, _setOffset] = React.useState<number>(0);
  const [limit, _setLimit] = React.useState<number>(0);
  const [filterState, _setFilterState] = React.useState({});

  const isTabletWidth = useMediaQuery("(min-width: 720px)");

  const setFilterState = (varDefName: string, value: boolean) => {
    setTimeout(() => {
      _setOffset(0);
      _setFilterState({ ...filterState, [varDefName]: value });
    }, 128);
  };

  const setLimit = (limit: number) => {
    setTimeout(() => {
      _setLimit(limit);
      _setOffset(0);
    }, 128);
  };

  const decrementPage = () => {
    const newOffset = offset - limit <= 0 ? 0 : offset - limit;
    _setOffset(newOffset);
  };

  const incrementPage = () => {
    const newOffset = offset + limit;
    _setOffset(newOffset);
  };

  let { definitions: _definitions } = ast;
  const definitions: OperationDefinitionNode[] = (_definitions: any);
  const queryDefinition = definitions[0];

  invariant(queryDefinition != null, "queryDefinition is null");

  // Initializing boolean filters on new queryDefinition
  React.useEffect(() => {
    const { variableDefinitions } = queryDefinition;
    if (variableDefinitions == null) {
      return;
    }

    let newFilterState = {};
    for (let variableDefinition of variableDefinitions) {
      const varName = variableDefinition.variable.name.value;
      const typeNameValue =
        // $FlowFixMe
        variableDefinition.type.name && variableDefinition.type.name.value;
      if (typeNameValue === "Boolean") {
        newFilterState[varName] = "undefined";
      }
    }
    _setFilterState(newFilterState);
  }, [queryDefinition]);

  // Calculating needed items limit
  React.useEffect(() => {
    // Return on mobile view
    if (!isTabletWidth) {
      _setLimit(1);
      return;
    }

    if (containerRef && containerRef.current) {
      const coords = containerRef.current.getBoundingClientRect();

      const newLimit = calculateItemsLimit({
        coords,
        cellStaticHeightValue: 48
      });

      _setLimit(newLimit);
    }
  }, [containerRef, isTabletWidth]);

  const classes = useStyles();

  // Replacing "undefined" -> undefined
  // SelectInput warns if value is undefined, so "undefined" is put there as a string
  const preparedFilterState = Object.keys(filterState).reduce((acc, key) => {
    return {
      ...acc,
      [key]: filterState[key] === "undefined" ? undefined : filterState[key]
    };
  }, {});

  const resourceData = withResourceErrorCatcher({
    getResource: () =>
      useResource(resource, { ...preparedFilterState, offset, limit }),
    catcher
  });

  if (resourceData == null || columns.length === 0) {
    catcher(
      new Error("resourceData is null OR columns.length === 0 in PickRenderer")
    );
    return null;
  }

  const data = _get(resourceData, fetch);

  const columnsMap = new Map();
  for (let column of columns) {
    columnsMap.set(column.name.value, column);
  }

  const columnNames = columns.map(column => column.name.value).sort();

  let columnNamesMap: { [key: string]: true } = columnNames.reduce(
    (acc, columnName) => {
      return { ...acc, [columnName]: true };
    },
    {}
  );
  let { id, name, ...rest } = columnNamesMap;
  columnNamesMap = { id, name, ...rest };

  const updatedColumnNames = Object.keys(columnNamesMap);

  const TableHeadRows = updatedColumnNames.map((columnName, index) => {
    const column = columnsMap.get(columnName);

    if (!column) {
      return null;
    }

    return RendererColumnCell ? (
      <RendererColumnCell column={column} index={index} key={index} />
    ) : (
      <TableCell align="left" key={columnName}>
        {columnName}
      </TableCell>
    );
  });

  const TableBodyRows = data.map((row, index) => {
    return RendererRow ? (
      <RendererRow row={row} columns={columns} index={index} key={index} />
    ) : (
      <TableRow
        key={row.id}
        hover={isRowClickable}
        style={{ cursor: isRowClickable ? "pointer" : "default" }}
        onClick={ev => (onRowClick && isRowClickable ? onRowClick(row) : null)}
      >
        {updatedColumnNames.map((columnName, index) => {
          const column = columnsMap.get(columnName);
          if (!column) {
            return null;
          }

          return RendererRowCell ? (
            <RendererRowCell
              row={row}
              column={column}
              index={index}
              key={index}
            />
          ) : (
            <TableCell key={columnName} align="left">
              <span>{String(row[columnName])}</span>
            </TableCell>
          );
        })}
      </TableRow>
    );
  });

  const whatToRender = Renderer ? (
    <Renderer resource={resourceData} columns={columns} />
  ) : (
    <div ref={containerRef}>
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <TableFilters
              filterState={filterState}
              setFilterState={setFilterState}
              variableDefinitions={
                queryDefinition.variableDefinitions
                  ? [...queryDefinition.variableDefinitions]
                  : queryDefinition.variableDefinitions
              }
            />

            {isTabletWidth ? (
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
            ) : data.length === 0 ? (
              <div style={{ padding: 16 }}>
                <Typography variant={"caption"}>No data</Typography>
              </div>
            ) : (
              data.map((row, index) => {
                const { id, name, ...rest } = row;
                const sortedRow = Object.keys(rest)
                  .sort()
                  .reduce(
                    (acc, dataKey) => ({ ...acc, [dataKey]: rest[dataKey] }),
                    {
                      id,
                      name
                    }
                  );

                return (
                  <div key={index} style={{ padding: 16 }}>
                    <ShowCard data={sortedRow} />
                  </div>
                );
              })
            )}

            <TablePagination
              data={data}
              limit={limit}
              offset={offset}
              decrementPage={decrementPage}
              incrementPage={incrementPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );

  return whatToRender;
};
