/**
 * @flow
 */

import * as React from "react";
import classNames from "classnames";
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

import {
  makeStyles,
  useTheme,
  ThemeProvider,
  type Theme,
} from "@material-ui/styles";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";

import Typography from "@material-ui/core/Typography";
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
import { IconButton } from "rex-ui/IconButton";

import { LoadingIndicator } from "./LoadingIndicator.js";

import { buildSortingConfig } from "./buildSortingConfig";
import { PickFilterToolbar } from "./PickFilterToolbar.js";
import { PickPagination } from "./PickPagination.js";
import { PickDataView } from "./PickDataView.js";
import * as Field from "./Field.js";

import { DEFAULT_THEME } from "./themes";
import { isEmptyObject, capitalize } from "./helpers";
import { type FilterSpecMap } from "./Pick";

export const useRendererStyles = makeStyles((theme: Theme) => {
  if (theme.palette == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
    root: {
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      display: "flex",
      flexDirection: "column",
      flex: "0 1 100%",
    },
    topPartWrapper: {
      position: "relative",
      zIndex: "10",
    },
    topPartWrapperMobile: {
      boxShadow: "0 0 10px -8px",
    },
  };
});

const useMinWindowWidth = (minWidth: number) => {
  const [doesMatch, setDoesMatch] = React.useState(
    window.innerWidth >= minWidth,
  );

  React.useEffect(() => {
    const handler = debounce(() => {
      setDoesMatch(window.innerWidth >= minWidth);
    }, 128);

    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
    };
  });

  return doesMatch;
};

type CustomRendererProps = { resource: Resource<any, any> };
type PickMode = "table" | "card-list";

export type RenderToolbarProps = {|
  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,
|};

export type RenderToolbar = React.AbstractComponent<RenderToolbarProps>;

export type PickRendererConfigProps = {|
  fetch: string,
  title?: string,
  description?: string,
  fieldDescription?: ?string,
  showAs?: PickMode,
  columnsWidth?: { [key: string]: string | number },
  sortableColumns?: ?Array<string>,

  RenderColumnCell?: (props: {
    column?: Field.FieldSpec,
    index: number,
  }) => React.Node,
  RenderRow?: (props: {
    columns?: Field.FieldSpec[],
    row?: any,
    index: number,
  }) => React.Node,
  RenderRowCell?: (props: {
    column?: Field.FieldSpec,
    row?: any,
    index: number,
  }) => React.Node,

  /**
   * Render toolbar.
   */
  RenderToolbar?: ?RenderToolbar,

  onRowClick?: (row: any) => void,
|};

export type PickRendererProps = {|
  resource: Resource<any, any>,
  columns: Field.FieldSpec[],
  variablesMap: ?Map<string, VariableDefinitionNode>,
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  args?: { [key: string]: any },
  theme?: Theme,
  filtersSpecs?: ?FilterSpecMap,

  selected: Set<string>,
  onSelected: (nextSelected: Set<string>) => void,

  ...PickRendererConfigProps,
|};

// TODO: We can make those constants -> props passed from component user
export const SEARCH_VAR_NAME = "search";

let usePickHeaderStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
  top: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toolbar: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.unit,
  },
  title: {
    marginBottom: "8px",
  },
}));

const PickHeader = ({ title, description, rightToolbar, bottomToolbar }) => {
  const classes = usePickHeaderStyles();

  return (
    <div className={classes.root}>
      <div className={classes.top}>
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
      {bottomToolbar != null && (
        <div className={classes.toolbar}>{bottomToolbar}</div>
      )}
    </div>
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

export const PickRenderer = ({
  resource,
  columns,
  fetch,
  variablesMap,
  RenderColumnCell,
  RenderRowCell,
  RenderRow,
  RenderToolbar,
  onRowClick,
  args,
  title,
  description,
  fieldDescription,
  showAs,
  columnsWidth,
  selected,
  onSelected,
  sortingConfig,
  filtersSpecs,
}: PickRendererProps) => {
  const isTabletWidth = useMinWindowWidth(720);

  const defaultPickState = {
    offset: 0,
    limit: isTabletWidth ? LIMIT_DESKTOP : LIMIT_MOBILE,
    search: null,
    searchText: null,
    sort: null,
    filter: {},
  };

  let [state, setState] = React.useState<PickState>(defaultPickState);

  React.useEffect(() => {
    setState(state => ({
      ...state,
      limit: isTabletWidth ? LIMIT_DESKTOP : LIMIT_MOBILE,
    }));
  }, [isTabletWidth]);

  React.useEffect(() => {
    setState(defaultPickState);
  }, [fetch]);

  const debouncedSetState = React.useMemo(() => debounce(setState, 256), []);

  const [viewData, setViewData] = React.useState<Array<any>>([]);

  const classes = useRendererStyles();

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
      sort: value === Field.FILTER_NO_VALUE ? undefined : JSON.parse(value),
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

  // Initialize search state if there's SEARCH_VAR_NAME
  React.useEffect(() => {
    if (variablesMap != null && variablesMap.get(SEARCH_VAR_NAME)) {
      setState(state => ({
        ...state,
        search: "",
        searchText: "",
      }));
    }
  }, []);

  /**
   * Decide if filters block is opened via state from localStorage
   */
  const filtersLocalStorageKey = variablesMap
    ? `rapidFiltersState__${Array.from(variablesMap.keys()).join("_")}`
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

  const topPartClassNames = [classes.topPartWrapper];
  if (!isTabletWidth) {
    topPartClassNames.push(classes.topPartWrapperMobile);
  }

  let theme = useTheme();

  return (
    <Paper className={classes.root}>
      {/* npm -> "classnames" would be handy here */}
      <div className={topPartClassNames.join(" ")}>
        <PickHeader
          title={title}
          description={description || fieldDescription}
          bottomToolbar={
            RenderToolbar != null ? (
              <MuiThemeProvider theme={theme}>
                <RenderToolbar selected={selected} onSelected={onSelected} />
              </MuiThemeProvider>
            ) : null
          }
          rightToolbar={
            <IconButton
              size="small"
              onClick={toggleFilters}
              active={showFilters}
              aria-label="Filter list"
              icon={<FilterListIcon />}
            />
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
            variablesMap={variablesMap}
            filtersSpecs={filtersSpecs}
          />
        ) : null}
      </div>

      <PickDataView
        state={state}
        sortingConfig={sortingConfig}
        setSortingState={setSortingState}
        onDataReceive={setViewData}
        columns={columns}
        isTabletWidth={isTabletWidth}
        fetch={fetch}
        resource={resource}
        onRowClick={onRowClick}
        showAs={showAs}
        columnsWidth={columnsWidth}
        selected={selected}
        onSelected={onSelected}
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
