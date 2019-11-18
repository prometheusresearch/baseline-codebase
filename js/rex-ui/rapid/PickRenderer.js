/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import {
  type DocumentNode,
  type FieldNode,
  type OperationDefinitionNode,
  type VariableDefinitionNode,
} from "graphql/language/ast";

import {
  type IntrospectionType,
  type IntrospectionInputObjectType,
  type IntrospectionInputValue,
  type IntrospectionEnumType,
} from "graphql/utilities/introspectionQuery";

import debounce from "lodash/debounce";

import { makeStyles, useTheme, ThemeProvider } from "@material-ui/styles";
import { createMuiTheme, type Theme } from "@material-ui/core/styles";
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
  unstable_useResource as useResource,
} from "rex-graphql/Resource";

import { LoadingIndicator } from "./LoadingIndicator.js";

import { buildSortingConfig } from "./buildSortingConfig";
import { usePickStyles } from "./styles";
import { PickFilterToolbar } from "./PickFilterToolbar.js";
import { PickPagination } from "./PickPagination.js";
import { PickDataView } from "./PickDataView.js";
import * as Field from "./Field.js";

type CustomRendererProps = { resource: Resource<any, any> };
type PickMode = "table" | "card-list";

export type FiltersConfig = Array<
  | string
  | {
      name: string,
      render?: React.ComponentType<{
        value: any,
        values?: Array<any>,
        onChange: (newValue: any) => void,
      }>,
    },
>;

export type FilterSpec = {|
  render: ?React.ComponentType<{
    value: any,
    values?: Array<any>,
    onChange: (newValue: any) => void,
  }>,
|};

export type FilterSpecMap = Map<string, FilterSpec>;

export type PickRendererConfigProps = {|
  fetch: string,
  title?: string,
  description?: string,
  fieldDescription?: ?string,
  showAs?: PickMode,
  sortableColumns?: string[],
  columnsWidth?: { [key: string]: string | number },
  filters?: FiltersConfig,

  RendererColumnCell?: (props: {
    column?: Field.FieldSpec,
    index: number,
  }) => React.Node,
  RendererRow?: (props: {
    columns?: Field.FieldSpec[],
    row?: any,
    index: number,
  }) => React.Node,
  RendererRowCell?: (props: {
    column?: Field.FieldSpec,
    row?: any,
    index: number,
  }) => React.Node,
  onRowClick?: (row: any) => void,
|};

export type PickRendererProps = {|
  resource: Resource<any, any>,
  columns: Field.FieldSpec[],
  queryDefinition: OperationDefinitionNode,
  introspectionTypesMap: Map<string, IntrospectionType>,
  args?: { [key: string]: any },
  theme?: Theme,

  ...PickRendererConfigProps,
|};

// TODO: We can make those constants -> props passed from component user
export const SORTING_VAR_NAME = "sort";
export const SEARCH_VAR_NAME = "search";

const PickHeader = ({ title, description, rightToolbar }) => {
  const classes = usePickStyles();

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
            <Typography variant={"caption"}>{description}</Typography>
          ) : null}
        </div>
        {rightToolbar && <div>{rightToolbar}</div>}
      </div>
    </>
  );
};

const LIMIT_MOBILE = 21;
const LIMIT_DESKTOP = 51;

type SortDirection = {| field: string, desc: boolean |};

export type PickState = {|
  offset: number,
  limit: number,
  search: ?string,
  searchText: ?string,
  sort: ?SortDirection,
  filter: { [key: string]: ?boolean },
|};

const filtersConfigToSpecs = (configs: ?FiltersConfig): ?FilterSpecMap => {
  if (configs == null || configs.length === 0) {
    return null;
  }
  let SpecMap: FilterSpecMap = new Map();

  for (let config of configs) {
    if (typeof config === "string") {
      SpecMap.set(config, { render: null });
    } else if (typeof config === "object") {
      SpecMap.set(config.name, { render: config.render });
    }
  }

  return SpecMap;
};

export const PickRenderer = ({
  resource,
  columns,
  fetch,
  queryDefinition,
  introspectionTypesMap,
  RendererColumnCell,
  RendererRowCell,
  RendererRow,
  onRowClick,
  args,
  title,
  description,
  fieldDescription,
  showAs,
  sortableColumns,
  columnsWidth,
  filters,
}: PickRendererProps) => {
  const isTabletWidth = useMediaQuery("(min-width: 720px)");

  let [state, setState] = React.useState<PickState>({
    offset: 0,
    limit: isTabletWidth ? LIMIT_DESKTOP : LIMIT_MOBILE,
    search: null,
    searchText: null,
    sort: null,
    filter: {},
  });

  React.useEffect(
    () =>
      setState(state => ({
        ...state,
        limit: isTabletWidth ? LIMIT_DESKTOP : LIMIT_MOBILE,
      })),
    [isTabletWidth],
  );

  const debouncedSetState = React.useMemo(() => debounce(setState, 256), []);

  const [viewData, setViewData] = React.useState<Array<any>>([]);

  const classes = usePickStyles();

  const setFilterState = (name: string, value: ?boolean) => {
    setState(state => ({
      ...state,
      offset: 0,
      filter: { ...state.filter, [name]: value },
    }));
  };

  const setSortingState = (value: string) => {
    setState(state => ({
      ...state,
      offset: 0,
      sort: value === Field.FILTER_NO_VALUE ? null : JSON.parse(value),
    }));
  };

  const setSearchState = (searchText: string) => {
    setState(state => ({
      ...state,
      offset: 0,
      searchText,
    }));

    debouncedSetState(state => ({ ...state, search: searchText }));
  };

  const decrementPage = () => {
    const offset =
      state.offset + 1 - state.limit <= 0 ? 0 : state.offset + 1 - state.limit;
    setState(state => ({
      ...state,
      offset,
    }));
  };

  const incrementPage = () => {
    const offset = state.offset - 1 + state.limit;
    setState(state => ({
      ...state,
      offset,
    }));
  };

  const { variableDefinitions } = queryDefinition;

  // Initialize search state if there's SEARCH_VAR_NAME
  React.useEffect(() => {
    if (
      variableDefinitions != null &&
      variableDefinitions.find(
        def => def.variable.name.value === SEARCH_VAR_NAME,
      )
    ) {
      setState(state => ({
        ...state,
        search: "",
        searchText: "",
      }));
    }
  }, [variableDefinitions]);

  const filtersSpecs = filtersConfigToSpecs(filters);

  const sortingConfig = buildSortingConfig({
    variableDefinitions,
    columns,
    introspectionTypesMap,
    variableDefinitionName: SORTING_VAR_NAME,
    sortableColumns,
    filtersSpecs,
  });

  /**
   * Decide if filters block is opened via state from localStorage
   */
  const filtersLocalStorageKey = queryDefinition.variableDefinitions
    ? `rapidFiltersState__${queryDefinition.variableDefinitions
        .map(obj => obj.variable.name.value)
        .join("_")}`
    : null;
  let filtersLocalStorageOpened = false;
  if (filtersLocalStorageKey != null) {
    filtersLocalStorageOpened = localStorage.getItem(filtersLocalStorageKey);
  }
  const initialShowFilterValue =
    filtersLocalStorageOpened === "true" ? true : false;
  const [showFilters, _setShowFilters] = React.useState(initialShowFilterValue);

  const toggleFilters = () => {
    _setShowFilters(v => !v);
    if (filtersLocalStorageKey != null) {
      localStorage.setItem(filtersLocalStorageKey, String(!showFilters));
    }
  };

  const iconButtonClassNames = showFilters
    ? classes.filterIconButtonActive
    : classes.filterIconButton;

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
          description={description || fieldDescription}
          rightToolbar={
            <IconButton
              onClick={toggleFilters}
              className={iconButtonClassNames}
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
            filtersSpecs={filtersSpecs}
          />
        ) : null}
      </div>

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
        onRowClick={onRowClick}
        showAs={showAs}
        columnsWidth={columnsWidth}
      />

      <PickPagination
        hasPrev={state.offset > 0}
        hasNext={viewData.length >= state.limit}
        onPrevPage={decrementPage}
        onNextPage={incrementPage}
      />
    </Paper>
  );
};
