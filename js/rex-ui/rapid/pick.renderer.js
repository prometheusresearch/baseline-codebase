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
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import Switch from "@material-ui/core/Switch";
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

import { withResourceErrorCatcher } from "./helpers";

import { ComponentLoading } from "./component.loading";

// import type { TypePropsRenderer } from "./Pick";

type CustomRendererProps = { resource: Resource<any, any> };

export type TypePropsRenderer = {|
  resource: Resource<any, any>,
  Renderer?: React.ComponentType<CustomRendererProps>,
  fetch: string,
  ast: DocumentNode,
  columns: FieldNode[],
  catcher: (err: Error) => void
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    marginTop: "8px",
    overflowX: "auto"
  },
  table: {
    minWidth: 420,
    marginBottom: "24px"
  },
  tableControl: {
    padding: "24px"
  },
  itemsCount: {
    padding: " 0 24px"
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
      justify="space-between"
      alignItems="center"
      spacing={8}
      className={classes.tableControl}
    >
      <Grid item xs={12}>
        <Typography variant={"h6"}>Filters</Typography>
      </Grid>

      <Grid item>
        <FormGroup row>
          {variableDefinitions
            .filter(varDef => {
              // $FlowFixMe
              const value = varDef.type.name
                ? varDef.type.name.value
                : undefined;
              return value === "Boolean";
            })
            .map(varDef => {
              const booleanFilterName = varDef.variable.name.value;

              return (
                <FormControlLabel
                  key={booleanFilterName}
                  control={
                    <Switch
                      checked={filterState[booleanFilterName] || false}
                      onChange={() =>
                        setFilterState(
                          booleanFilterName,
                          !filterState[booleanFilterName]
                        )
                      }
                      value={filterState[booleanFilterName] || false}
                      color="primary"
                    />
                  }
                  label={`${booleanFilterName}`}
                />
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
  setLimit,
  offset,
  decrementPage,
  incrementPage
}: {|
  data: any,
  limit: number,
  offset: number,
  setLimit: (pageSize: number) => void,
  decrementPage: () => void,
  incrementPage: () => void
|}) => {
  const classes = useStyles();

  return (
    <Grid
      container
      direction="row"
      justify="space-between"
      alignItems="center"
      spacing={8}
      className={classes.tableControl}
    >
      <Grid item xs={4}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="page-size">Page size</InputLabel>
          <Select
            value={limit}
            onChange={ev => setLimit(ev.target.value)}
            inputProps={{
              name: "page-size"
            }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={15}>15</MenuItem>
          </Select>
        </FormControl>
      </Grid>

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

export const PickRenderer = ({
  resource,
  Renderer,
  catcher,
  columns,
  fetch,
  ast
}: TypePropsRenderer) => {
  const [offset, _setOffset] = React.useState<number>(0);
  const [limit, _setLimit] = React.useState<number>(5);
  const [filterState, _setFilterState] = React.useState({});

  const setFilterState = (varDefName: string, value: boolean) => {
    _setOffset(0);
    _setFilterState({ ...filterState, [varDefName]: value });
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
        newFilterState[varName] = false;
      }
    }
    _setFilterState(newFilterState);

    variableDefinitions;
  }, [queryDefinition]);

  const classes = useStyles();

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource, { ...filterState, offset, limit }),
    catcher
  });

  if (resourceData == null || columns.length === 0) {
    return null;
  }

  const data = _get(resourceData, fetch);

  const whatToRender = Renderer ? (
    <Renderer resource={resourceData} columns={columns} />
  ) : (
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

          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((column, index) => {
                  return (
                    <TableCell align="left" key={column.name.value}>
                      {column.name.value}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => {
                return (
                  <TableRow key={row.id}>
                    {columns.map((column, index) => {
                      return (
                        <TableCell key={column.name.value} align="left">
                          <span>{String(row[column.name.value])}</span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {data.length > 0 ? (
            <div className={classes.itemsCount}>
              <Typography variant={"caption"}>
                {`Items ${offset || 1} - ${offset + data.length}`}
              </Typography>
            </div>
          ) : null}

          <TablePagination
            data={data}
            limit={limit}
            offset={offset}
            setLimit={setLimit}
            decrementPage={decrementPage}
            incrementPage={incrementPage}
          />
        </Paper>
      </Grid>
    </Grid>
  );

  return whatToRender;
};
