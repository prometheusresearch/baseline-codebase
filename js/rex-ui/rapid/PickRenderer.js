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

import { makeStyles } from "@material-ui/styles";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";

import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import {
  type Resource,
  unstable_useResource as useResource
} from "rex-graphql/Resource";

import { sortObjectFieldsWithPreferred } from "./helpers";

import { LoadingIndicator } from "./LoadingIndicator.js";

import { buildSortingConfig } from "./buildSortingConfig";
import { useStyles } from "./PickStyles.js";
import { PickFilterToolbar } from "./PickFilterToolbar.js";
import { PickPagination } from "./PickPagination.js";
import { PickDataView } from "./PickDataView.js";
import { type FieldSpec } from "./buildQuery";

type CustomRendererProps = { resource: Resource<any, any> };

export type PickRendererConfigProps = {|
  fetch: string,
  isRowClickable?: boolean,
  title?: string,
  description?: string,

  RendererColumnCell?: (props: {
    column?: FieldSpec,
    index: number
  }) => React.Node,
  RendererRow?: (props: {
    columns?: FieldSpec[],
    row?: any,
    index: number
  }) => React.Node,
  RendererRowCell?: (props: {
    column?: FieldSpec,
    row?: any,
    index: number
  }) => React.Node,
  onRowClick?: (row: any) => void
|};

export type PickRendererProps = {|
  resource: Resource<any, any>,
  columns: FieldSpec[],
  queryDefinition: OperationDefinitionNode,
  introspectionTypesMap: Map<string, IntrospectionType>,
  args?: { [key: string]: any },

  ...PickRendererConfigProps
|};

// TODO: We can make those constants -> props passed from component user
const SORTING_VAR_NAME = "sort";
const SEARCH_VAR_NAME = "search";

const PickHeader = ({ title, description, rightToolbar }) => {
  const classes = useStyles();
  return (
    <>
      <div className={classes.topPart}>
        <div>
          {title ? (
            <Typography variant={"h5"} className={classes.title}>
              {title}
            </Typography>
          ) : null}
          {description ? (
            <Typography variant={"caption"} className={classes.description}>
              {description}
            </Typography>
          ) : null}
        </div>
        {rightToolbar && <div>{rightToolbar}</div>}
      </div>
    </>
  );
};

const LIMIT_MOBILE = 20;
const LIMIT_DESKTOP = 50;

export const PickRenderer = ({
  resource,
  columns,
  fetch,
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
}: PickRendererProps) => {
  const [offset, setOffset] = React.useState<number>(0);
  const [limit, setLimit] = React.useState<number>(0);
  const [filterState, _setFilterState] = React.useState<{ [key: string]: any }>(
    {}
  );
  const [showFilters, _setShowFilters] = React.useState(false);
  const [sortingState, _setSortingState] = React.useState<void | {|
    field: string,
    desc: boolean
  |}>(undefined);
  const [searchState, _setSearchState] = React.useState<?string>(null);
  const [viewData, setViewData] = React.useState<Array<any>>([]);

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

  const className = showFilters ? classes.filterIconButtonActive : undefined;

  const topPartClassNames = [classes.topPartWrapper];
  if (!isTabletWidth) {
    topPartClassNames.push(classes.topPartWrapperMobile);
  }

  return (
    <Grid container spacing={8} className={classes.rendererRoot}>
      <Grid item xs={12}>
        <Paper className={classes.root}>
          {/* npm -> "classnames" would be handy here */}
          <div className={topPartClassNames.join(" ")}>
            <PickHeader
              title={title}
              description={description}
              rightToolbar={
                <IconButton
                  onClick={toggleFilters}
                  className={className}
                  aria-label="Filter list"
                >
                  <FilterListIcon />
                </IconButton>
              }
            />
            {showFilters ? (
              <PickFilterToolbar
                filterState={filterState}
                setFilterState={setFilterState}
                sortingConfig={sortingConfig}
                sortingState={sortingState}
                setSortingState={setSortingState}
                searchState={searchState}
                setSearchState={setSearchState}
                isTabletWidth={isTabletWidth}
                variableDefinitions={
                  queryDefinition.variableDefinitions
                    ? [...queryDefinition.variableDefinitions]
                    : queryDefinition.variableDefinitions
                }
              />
            ) : null}
          </div>

          <React.Suspense
            fallback={
              <div className={classes.tableWrapper}>{<LoadingIndicator />}</div>
            }
          >
            <PickDataView
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
                  : queryDefinition.variableDefinitions || []
              }
              onDataReceive={setViewData}
              columns={columns}
              isTabletWidth={isTabletWidth}
              fetch={fetch}
              offset={offset}
              limit={limit}
              resource={resource}
              preparedFilterState={preparedFilterState}
              isRowClickable={isRowClickable}
              onRowClick={onRowClick}
            />
          </React.Suspense>

          <PickPagination
            hasPrev={offset > 0}
            hasNext={viewData.length >= limit}
            onPrevPage={decrementPage}
            onNextPage={incrementPage}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};
