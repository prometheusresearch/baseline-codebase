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

type CustomRendererProps = { resource: Resource<any, any> };

export type TypePropsRenderer = {|
  resource: Resource<any, any>,
  Renderer?: React.ComponentType<CustomRendererProps>,
  fetch: string,
  ast: DocumentNode,
  columns: FieldNode[],
  RendererColumnCell?: (props: {
    column: FieldNode,
    index: number
  }) => React.Node,
  RendererRowCell?: (props: {
    column: FieldNode,
    row: any,
    index: number
  }) => React.Node,
  RendererRow?: (props: {
    columns: FieldNode[],
    row: any,
    index: number
  }) => React.Node,
  ref?: any,
  catcher: (err: Error) => void,
  isRowClickable?: boolean,
  onRowClick?: (row: any) => void
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
  itemsCount: {
    padding: "0 16px"
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
                    <MenuItem value={"undefined"}>Not applied</MenuItem>
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
    return null;
  }

  const data = _get(resourceData, fetch);

  const TableHeadRows = columns.map((column, index) => {
    return RendererColumnCell ? (
      <RendererColumnCell column={column} index={index} key={index} />
    ) : (
      <TableCell align="left" key={column.name.value}>
        {column.name.value}
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
        {columns.map((column, index) => {
          return RendererRowCell ? (
            <RendererRowCell
              row={row}
              column={column}
              index={index}
              key={index}
            />
          ) : (
            <TableCell key={column.name.value} align="left">
              <span>{String(row[column.name.value])}</span>
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
            ) : (
              data.map((row, index) => {
                return (
                  <div key={index} style={{ padding: 16 }}>
                    <ShowCard data={row} />
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
