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

import {
  type IntrospectionType,
  type IntrospectionInputObjectType,
  type IntrospectionInputValue,
  type IntrospectionEnumType
} from "graphql/utilities/introspectionQuery";

import { makeStyles, useTheme } from "@material-ui/styles";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TableRow from "@material-ui/core/TableRow";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import SwapVertIcon from "@material-ui/icons/SwapVert";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

import _get from "lodash/get";

import {
  type Resource,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import {
  withResourceErrorCatcher,
  sortObjectFieldsWithPreferred,
  debounce
} from "./helpers";

import { ComponentLoading } from "./component.loading";
import { ShowRenderer, ShowCard } from "./show.renderer";

import { type PropsSharedWithRenderer } from "./pick";
import { buildSortingConfig } from "./buildSortingConfig";

type CustomRendererProps = { resource: Resource<any, any> };

export type TypePropsRenderer = {|
  resource: Resource<any, any>,
  Renderer?: React.ComponentType<CustomRendererProps>,

  ast: DocumentNode,
  columns: FieldNode[],
  queryDefinition: OperationDefinitionNode,
  introspectionTypesMap: Map<string, IntrospectionType>,
  catcher: (err: Error) => void,
  args?: { [key: string]: any },

  ...PropsSharedWithRenderer
|};

const useStyles = makeStyles({
  root: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    maxHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  table: {
    minWidth: 720
  },
  tableControl: {
    padding: "16px"
  },
  paginationWrapper: {
    position: "relative",
    zIndex: "5",
    padding: "16px",
    boxShadow: "0 0 10px -8px",
    margin: 0,
    width: "100%"
  },
  formControl: {
    minWidth: 120,
    marginLeft: 16
  },
  tableHead: {
    background: "white",
    position: "sticky",
    top: 0
  },
  tableHeadSortable: {
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 5px 0px -4px"
    }
  },
  tableHeadSorted: {
    boxShadow: "0 5px 0px -4px"
  },
  tableWrapper: {
    overflowY: "scroll"
  },
  title: {
    marginBottom: "8px"
  },
  description: {},
  topPart: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "16px"
  },
  topPartWrapper: {
    position: "relative",
    zIndex: "10"
  },
  tableCellContentWrapper: {
    display: "relative",
    paddingRight: 24
  },
  tableCellSortIcon: {
    position: "absolute",
    top: 16,
    right: 6
  }
});

// TODO: We can make those constants -> props passed from component user
const SORTING_VAR_NAME = "sort";
const SEARCH_VAR_NAME = "search";

const TableFilters = ({
  variableDefinitions,
  filterState,
  sortingConfig,
  setFilterState,
  sortingState,
  setSortingState,
  searchState,
  setSearchState
}: {|
  variableDefinitions: VariableDefinitionNode[] | void,
  filterState: { [key: string]: boolean },
  sortingConfig: Array<{| desc: boolean, field: string |}>,
  sortingState: {| field: string, desc: boolean |} | void,
  searchState: ?string,
  setSearchState: (val: string) => void,
  setFilterState: (name: string, value: boolean) => void,
  setSortingState: (value: string) => void
|}) => {
  const classes = useStyles();
  const hasSorting = sortingConfig.length > 0;
  const hasSearch = searchState != null;

  const [isSearchInFocus, _setIsSearchInFocus] = React.useState(false);

  const setIsSearchInFocus = (val: boolean) => _setIsSearchInFocus(val);

  React.useEffect(() => {
    if (isSearchInFocus) {
      searchInputRef.current ? searchInputRef.current.focus() : null;
    }
  });

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
          {hasSearch ? (
            <FormControl className={classes.formControl}>
              <TextField
                label="Search"
                value={searchState}
                onChange={ev => {
                  // Need this to restore focus state after Suspense is loaded resources
                  isSearchInFocus ? null : setIsSearchInFocus(true);
                  setSearchState(ev.target.value);
                }}
                onBlur={() => {
                  // Can not setIsSearchInFocus(false) here, since it would be also
                  // triggered by Suspense-based unmounts
                }}
                margin={"none"}
                InputLabelProps={{
                  shrink: true
                }}
                inputRef={searchInputRef}
              />
            </FormControl>
          ) : null}

          {hasSorting ? (
            <FormControl className={classes.formControl}>
              <InputLabel htmlFor={`sorting`}>{"Sorting"}</InputLabel>
              <Select
                value={
                  sortingState ? JSON.stringify(sortingState) : "undefined"
                }
                onChange={ev => {
                  setIsSearchInFocus(false);
                  setSortingState(ev.target.value);
                }}
                inputProps={{
                  name: `sorting`
                }}
              >
                <MenuItem key={"undefined"} value={"undefined"} />
                {sortingConfig.map((obj, index) => {
                  const value = JSON.stringify(obj);
                  return (
                    <MenuItem key={index} value={value}>
                      {`${obj.field}, ${obj.desc ? "desc" : "asc"}`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          ) : null}

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
                      setIsSearchInFocus(false);
                      setFilterState(booleanFilterName, ev.target.value);
                    }}
                    inputProps={{
                      name: `boolean-filter-${booleanFilterName}`
                    }}
                  >
                    <MenuItem value={"undefined"} />
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
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage
}: {|
  hasNext: boolean,
  hasPrev: boolean,
  onNextPage: () => void,
  onPrevPage: () => void
|}) => {
  const classes = useStyles();

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      spacing={2}
      className={classes.paginationWrapper}
    >
      <Grid item>
        <IconButton
          aria-label="previous"
          color="default"
          onClick={onPrevPage}
          disabled={!hasPrev}
        >
          <ChevronLeftIcon />
        </IconButton>

        <IconButton
          aria-label="next"
          color="default"
          onClick={onNextPage}
          disabled={!hasNext}
        >
          <ChevronRightIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

const containerRef = React.createRef();
const searchInputRef = React.createRef();

const LIMIT_MOBILE = 20;
const LIMIT_DESKTOP = 50;

export const PickRenderer = ({
  resource,
  Renderer,
  catcher,
  columns,
  fetch,
  ast,
  queryDefinition,
  introspectionTypesMap,
  RendererColumnCell,
  RendererRowCell,
  RendererRow,
  isRowClickable,
  onRowClick,
  args,
  title,
  description
}: TypePropsRenderer) => {
  const [offset, setOffset] = React.useState<number>(0);
  const [limit, setLimit] = React.useState<number>(0);
  const [filterState, _setFilterState] = React.useState({});
  const [showFilters, _setShowFilters] = React.useState(false);
  const [sortingState, _setSortingState] = React.useState<void | {|
    field: string,
    desc: boolean
  |}>(undefined);
  const [searchState, _setSearchState] = React.useState<?string>(null);

  const isTabletWidth = useMediaQuery("(min-width: 720px)");
  const classes = useStyles();

  const setFilterState = (varDefName: string, value: boolean) => {
    setTimeout(() => {
      setOffset(0);
      _setFilterState({ ...filterState, [varDefName]: value });
    }, 128);
  };

  const setSortingState = (value: string) => {
    setTimeout(() => {
      value === "undefined"
        ? _setSortingState(undefined)
        : _setSortingState(JSON.parse(value));
    }, 128);
  };

  const toggleFilters = () => {
    setTimeout(() => {
      _setShowFilters(!showFilters);
    }, 128);
  };

  const setSearchState = (val: string) => {
    _setSearchState(val);
  };

  const decrementPage = () => {
    const newOffset = offset - limit <= 0 ? 0 : offset - limit;
    setOffset(newOffset);
  };

  const incrementPage = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
  };

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

      /// Add search filter
      if (varName === SEARCH_VAR_NAME && typeNameValue === "String") {
        setSearchState("");
      }

      // Add boolean filter to filterState
      if (typeNameValue === "Boolean") {
        newFilterState[varName] = "undefined";
      }
    }
    _setFilterState(newFilterState);
  }, [queryDefinition]);

  // Calculating needed items limit
  React.useEffect(() => {
    if (!isTabletWidth) {
      setLimit(LIMIT_MOBILE);
    } else {
      setLimit(LIMIT_DESKTOP);
    }
  }, [isTabletWidth]);

  // Handle search param
  React.useEffect(() => {
    console.log("searchState: ", searchState);
  }, [searchState]);

  // Replacing "undefined" -> undefined
  // SelectInput warns if value is undefined
  // So every SelectInput undefined value is set as a string "undefined"
  const preparedFilterState = Object.keys(filterState).reduce((acc, key) => {
    return {
      ...acc,
      [key]: filterState[key] === "undefined" ? undefined : filterState[key]
    };
  }, {});

  const { variableDefinitions } = queryDefinition;

  const sortingConfig = buildSortingConfig({
    variableDefinitions,
    introspectionTypesMap,
    variableDefinitionName: SORTING_VAR_NAME
  });

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
      // TODO: Fix this string/object mess in sortingState value!
      // sort: sortingState === "undefined" ? undefined : JSON.parse(sortingState)
      sort: sortingState
    };
  }
  if (searchState) {
    gqlQueryParams = { ...gqlQueryParams, search: searchState };
  }

  const resourceData = withResourceErrorCatcher({
    getResource: () => useResource(resource, gqlQueryParams),
    catcher
  });

  if (resourceData == null || columns.length === 0) {
    catcher(
      new Error("resourceData is null OR columns.length === 0 in PickRenderer")
    );
    return null;
  }

  const data = _get(resourceData, fetch);

  // TODO: Looks messy
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

  // TODO: Move to separate function
  const TableHeadRows = updatedColumnNames.map((columnName, index) => {
    const column = columnsMap.get(columnName);

    let cellClasses = `${classes.tableHead} `;
    const isSortable = sortingConfig.find(obj => obj.field === columnName);

    if (isSortable) {
      cellClasses = `${cellClasses} ${classes.tableHeadSortable}`;
    }

    const parsedSortingState = sortingState;

    const isSortedAsc =
      sortingState && sortingState.field === columnName && !sortingState.desc;
    const isSortedDesc =
      sortingState && sortingState.field === columnName && sortingState.desc;

    if (isSortedAsc || isSortedDesc) {
      cellClasses = `${cellClasses} ${classes.tableHeadSorted}`;
    }

    if (!column) {
      return null;
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

    return RendererColumnCell ? (
      <RendererColumnCell column={column} index={index} key={index} />
    ) : (
      <TableCell
        onClick={onTableHeadClick}
        align="left"
        key={columnName}
        className={cellClasses}
      >
        <div className={classes.tableCellContentWrapper}>
          {columnName}

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
      </TableCell>
    );
  });

  // TODO: Move to separate function
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

          let cellValue;
          switch (row[columnName]) {
            case undefined:
            case null: {
              cellValue = "—";
              break;
            }
            case true: {
              cellValue = "Yes";
              break;
            }
            case false: {
              cellValue = "No";
              break;
            }
            default: {
              cellValue = String(row[columnName]);
            }
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
              <span>{cellValue}</span>
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
            <div className={classes.topPartWrapper}>
              <div className={classes.topPart}>
                <div>
                  {title ? (
                    <Typography variant={"h5"} className={classes.title}>
                      {title}
                    </Typography>
                  ) : null}
                  {description ? (
                    <Typography
                      variant={"caption"}
                      className={classes.description}
                    >
                      {description}
                    </Typography>
                  ) : null}
                </div>
                <div>
                  <IconButton onClick={toggleFilters} aria-label="Filter list">
                    <FilterListIcon />
                  </IconButton>
                </div>
              </div>

              {showFilters ? (
                <TableFilters
                  filterState={filterState}
                  setFilterState={setFilterState}
                  sortingConfig={sortingConfig}
                  sortingState={sortingState}
                  setSortingState={setSortingState}
                  searchState={searchState}
                  setSearchState={setSearchState}
                  variableDefinitions={
                    queryDefinition.variableDefinitions
                      ? [...queryDefinition.variableDefinitions]
                      : queryDefinition.variableDefinitions
                  }
                />
              ) : null}
            </div>

            {/* TODO: Refactor this ugly rendering code */}
            {isTabletWidth ? (
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
            ) : data.length === 0 ? (
              <div className={classes.tableWrapper}>
                <Typography variant={"caption"}>No data</Typography>
              </div>
            ) : (
              <div className={classes.tableWrapper}>
                {data.map((row, index) => {
                  const sortedRow = sortObjectFieldsWithPreferred(row);

                  return (
                    <div key={index}>
                      <ShowCard data={sortedRow} />
                    </div>
                  );
                })}
              </div>
            )}

            <TablePagination
              hasPrev={offset > 0}
              hasNext={data.length >= limit}
              onPrevPage={decrementPage}
              onNextPage={incrementPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );

  return whatToRender;
};
