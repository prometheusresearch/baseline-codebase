/**
 * @flow
 */

import * as React from "react";

import Paper from "@material-ui/core/Paper";

import { type Theme, makeStyles } from "../themes";
import * as Action from "../Action.js";
import * as Field from "../Field.js";
import * as Filter from "../Filter.js";

import type { SortSpec, Params } from "./Pick";
import { buildParams } from "./Pick";
import { PickFilterToolbar } from "./PickFilterToolbar.js";
import { PickPagination } from "./PickPagination.js";
import { PickTableView } from "./PickTableView.js";
import { PickCardListView } from "./PickCardListView";
import { PickHeader } from "./PickHeader";
import { PickSearchToolbar } from "./PickSearchToolbar.js";

type PickMode = "table" | "card-list";

export type RenderToolbarProps = {|
  selected: Set<mixed>,
  onSelected: (nextSelected: Set<mixed>) => void,
|};

export type RenderToolbar = React.AbstractComponent<RenderToolbarProps>;

export type PickRendererConfigProps<R = any> = {|
  flat?: boolean,
  square?: boolean,
  title?: string,
  description?: string,
  fieldDescription?: ?string,
  showAs?: PickMode,
  hideSortSelect?: boolean,

  RenderColumnCell?: (props: {
    column?: Field.FieldSpec,
    index: number,
  }) => React.Node,
  RenderRow?: (props: {
    columns?: Field.FieldSpec[],
    row?: R,
    index: number,
  }) => React.Node,
  RenderRowCell?: (props: {
    column?: Field.FieldSpec,
    row?: R,
    index: number,
  }) => React.Node,

  /**
   * Render toolbar.
   */
  RenderToolbar?: ?RenderToolbar,

  onSelect?: (row: R) => void,
  onSelectMany?: (rows: Array<R>) => void,
  namespace?: ?string,
|};

export type PickSelection<O> =
  | {|
      type: "selected",
      rows: Array<O>,
    |}
  | {| type: "all" |};

export type PickRendererProps<O> = {|
  isTabletWidth: boolean,
  loading: boolean,
  data: Array<O>,
  actions?: Action.ActionConfig<any, PickSelection<O>>[],
  fields: Array<Field.FieldSpec>,
  args?: { [key: string]: any },
  theme?: Theme,
  filters?: ?Filter.FilterSpecMap,
  sorts: ?SortSpec<string>,
  search: ?Filter.FilterSpec,

  selected: Set<mixed>,
  onSelected: (nextSelected: Set<mixed>) => void,

  params: Params,
  onParams: ((Params) => Params) => void,
  offset: number,
  onOffset: number => void,
  limit: number,
  hasNext: boolean,
  hasPrev: boolean,
  disablePagination: boolean,

  ...PickRendererConfigProps<>,
|};

export const PickRenderer = <O: { id: string, [key: string]: mixed }>({
  loading,
  data,
  isTabletWidth,
  fields,
  RenderColumnCell,
  RenderRowCell,
  RenderRow,
  RenderToolbar,
  onSelect,
  onSelectMany,
  params,
  onParams,
  offset,
  onOffset,
  limit,
  args,
  actions,
  title,
  description,
  fieldDescription,
  showAs,
  selected,
  onSelected,
  sorts,
  filters,
  search,
  flat,
  square,
  disablePagination,
  hideSortSelect,
  hasNext,
  hasPrev,
}: PickRendererProps<O>) => {
  const classes = useStyles();

  const decrementPage = () => {
    onOffset(offset + 1 - limit <= 0 ? 0 : offset + 1 - limit);
  };

  const incrementPage = () => {
    onOffset(offset - 1 + limit);
  };

  const topPartClassNames = [classes.topPartWrapper];
  if (!isTabletWidth) {
    topPartClassNames.push(classes.topPartWrapperMobile);
  }

  let toolbar = null;
  if (RenderToolbar != null) {
    toolbar = <RenderToolbar selected={selected} onSelected={onSelected} />;
  } else if (actions != null) {
    let actionButtons = actions.map(action => {
      let selection = action.all
        ? { type: "all" }
        : {
            type: "selected",
            rows: data.filter(row => selected.has(row.id)),
          };
      return (
        <div key={action.name}>
          {Action.render(
            action,
            selection,
            buildParams({
              params,
              disablePagination: true,
              limit: 0,
              offset: 0,
            }),
            { variant: "outlined" },
          )}
        </div>
      );
    });
    toolbar = <div>{actionButtons}</div>;
  }

  let dataView = null;
  let dataViewProps: PickDataViewProps<O> = {
    sorts: sorts,
    fields: fields,
    loading: loading,
    data: data,
    onSelect: onSelect,
    onSelectMany: onSelectMany,
    isTabletWidth: isTabletWidth,
    showAs: showAs,
    selected: selected,
    onSelected: onSelected,
    params: params,
    onParams: onParams,
  };

  if ((!isTabletWidth && showAs !== "table") || showAs === "card-list") {
    dataView = <PickCardListView {...dataViewProps} />;
  } else {
    dataView = <PickTableView {...dataViewProps} />;
  }

  return (
    <Paper elevation={flat ? 0 : null} square={square} className={classes.root}>
      {/* npm -> "classnames" would be handy here */}
      <div className={topPartClassNames.join(" ")}>
        <PickHeader
          title={title}
          description={description || fieldDescription}
          toolbar={toolbar}
          searchBar={
            <PickSearchToolbar
              params={params}
              onParams={onParams}
              search={search}
            />
          }
        />

        <PickFilterToolbar
          params={params}
          onParams={onParams}
          sorts={hideSortSelect ? null : sorts}
          isTabletWidth={isTabletWidth}
          filters={filters}
        />
      </div>

      {dataView}

      {!disablePagination && (
        <PickPagination
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrevPage={decrementPage}
          onNextPage={incrementPage}
        />
      )}
    </Paper>
  );
};

export type PickDataViewProps<O: { id: string, [key: string]: mixed }> = {|
  loading: boolean,
  data: Array<O>,
  fields: Array<Field.FieldSpec>,
  args?: { [key: string]: any },
  isTabletWidth: boolean,
  sorts: ?SortSpec<string>,
  selected: Set<mixed>,
  onSelected: (nextSelected: Set<mixed>) => void,
  params: Params,
  onParams: ((Params) => Params) => void,

  ...PickRendererConfigProps<>,
|};

export const useStyles = makeStyles((theme: Theme) => {
  return {
    root: {
      width: "100%",
      // height: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: "0%",
      minHeight: 0,
      position: "relative",
    },
    topPartWrapper: {
      position: "relative",
      zIndex: "10",
    },
    topPartWrapperMobile: {},
  };
});
