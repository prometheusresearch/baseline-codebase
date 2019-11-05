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

import { LoadingIndicator } from "./LoadingIndicator.js";

import { buildSortingConfig } from "./buildSortingConfig";
import { useStyles } from "./PickStyles.js";
import { PickFilterToolbar } from "./PickFilterToolbar.js";
import { PickPagination } from "./PickPagination.js";
import { PickDataView } from "./PickDataView.js";
import * as Field from "./Field.js";
import { number, bool } from "prop-types";

type CustomRendererProps = { resource: Resource<any, any> };

export type PickRendererConfigProps = {|
  fetch: string,
  isRowClickable?: boolean,
  title?: string,
  description?: string,

  RendererColumnCell?: (props: {
    column?: Field.FieldSpec,
    index: number
  }) => React.Node,
  RendererRow?: (props: {
    columns?: Field.FieldSpec[],
    row?: any,
    index: number
  }) => React.Node,
  RendererRowCell?: (props: {
    column?: Field.FieldSpec,
    row?: any,
    index: number
  }) => React.Node,
  onRowClick?: (row: any) => void
|};

export type PickRendererProps = {|
  resource: Resource<any, any>,
  columns: Field.FieldSpec[],
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

type SortDirection = {| field: string, desc: boolean |};

export type PickState = {|
  offset: number,
  limit: number,
  search: ?string,
  sort: ?SortDirection,
  filter: { [key: string]: ?boolean }
|};

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
  let [state, setState] = React.useState<PickState>({
    offset: 0,
    limit: LIMIT_DESKTOP,
    search: null,
    sort: null,
    filter: {}
  });

  const [showFilters, _setShowFilters] = React.useState(false);

  const [viewData, setViewData] = React.useState<Array<any>>([]);

  const isTabletWidth = useMediaQuery("(min-width: 720px)");
  const classes = useStyles();

  const setFilterState = (name: string, value: ?boolean) => {
    setState(state => ({
      ...state,
      offset: 0,
      filter: { ...state.filter, [name]: value }
    }));
  };

  const setSortingState = (value: string) => {
    setState(state => ({
      ...state,
      offset: 0,
      sort: value === "__undefined__" ? null : JSON.parse(value)
    }));
  };

  const toggleFilters = () => {
    _setShowFilters(v => !v);
  };

  const setSearchState = (search: string) => {
    setState(state => ({
      ...state,
      offset: 0,
      search
    }));
  };

  const decrementPage = () => {
    const offset =
      state.offset - state.limit <= 0 ? 0 : state.offset - state.limit;
    setState(state => ({
      ...state,
      offset
    }));
  };

  const incrementPage = () => {
    const offset = state.offset + state.limit;
    setState(state => ({
      ...state,
      offset
    }));
  };

  const { variableDefinitions } = queryDefinition;

  // Initialize search state if there's SEARCH_VAR_NAME
  React.useEffect(() => {
    if (
      variableDefinitions != null &&
      variableDefinitions.find(
        def => def.variable.name.value === SEARCH_VAR_NAME
      )
    ) {
      setState(state => ({
        ...state,
        search: ""
      }));
    }
  }, [variableDefinitions]);

  const sortingConfig = buildSortingConfig({
    variableDefinitions,
    columns,
    introspectionTypesMap,
    variableDefinitionName: SORTING_VAR_NAME
  });

  const className = showFilters ? classes.filterIconButtonActive : undefined;

  const topPartClassNames = [classes.topPartWrapper];
  if (!isTabletWidth) {
    topPartClassNames.push(classes.topPartWrapperMobile);
  }

  return (
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
            state={state}
            setFilterState={setFilterState}
            sortingConfig={sortingConfig}
            setSortingState={setSortingState}
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
          <div className={classes.center}>
            <LoadingIndicator />
          </div>
        }
      >
        <PickDataView
          state={state}
          sortingConfig={sortingConfig}
          setSortingState={setSortingState}
          variableDefinitions={
            queryDefinition.variableDefinitions
              ? [...queryDefinition.variableDefinitions]
              : queryDefinition.variableDefinitions || []
          }
          onDataReceive={setViewData}
          columns={columns}
          isTabletWidth={isTabletWidth}
          fetch={fetch}
          resource={resource}
          isRowClickable={isRowClickable}
          onRowClick={onRowClick}
        />
      </React.Suspense>

      <PickPagination
        hasPrev={state.offset > 0}
        hasNext={viewData.length >= state.limit}
        onPrevPage={decrementPage}
        onNextPage={incrementPage}
      />
    </Paper>
  );
};
