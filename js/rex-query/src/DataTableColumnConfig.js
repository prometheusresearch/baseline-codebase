/**
 * @flow
 */

import type {
  Type,
  Query,
  SelectQuery,
  QueryPipeline,
  NavigateQuery
} from "./model/types";
import type { ColumnConfig } from "./ui/datatable/DataTable";

import { getDataByKey } from "./ui/datatable";
import * as ArrayUtil from "./ArrayUtil";
import * as DataTableColumnFormatter from "./DataTableColumnFormatter";

/**
 * Data associated with column.
 */
export type ColumnSpecData = {
  query: Query,
  navigatePath: Array<string>,
  navigateFromPipeline: QueryPipeline,
  pipeline: QueryPipeline,
  select: ?SelectQuery,
  navigate: ?NavigateQuery,
  type: Type,
  focusedSeq: Array<string>,
  focused: boolean
};

/**
 * Info needed during query traverse.
 */
type QueryTraverseContext = {
  focusedSeq: Array<string>,
  navigatePath: Array<string>,
  navigateFromPipeline: QueryPipeline,
  path: Array<string>,
  queryPipeline: QueryPipeline,
  selectQuery: ?SelectQuery,
  bindingName: ?string,
  suppressPath: boolean,
  currentStack?: Array<ColumnConfig<ColumnSpecData>>
};

/**
 * Produce column config for a query.
 */
export function fromQuery(
  query: QueryPipeline,
  focusedSeq: Array<string> = []
): ColumnConfig<ColumnSpecData> {
  const ctx: QueryTraverseContext = {
    queryPipeline: query,
    selectQuery: null,
    navigatePath: [],
    navigateFromPipeline: query,
    path: [],
    focusedSeq,
    bindingName: null,
    suppressPath: false,
    currentStack: undefined
  };
  return fromQueryImpl(query, ctx);
}

function fromQueryImpl(query: Query, ctx: QueryTraverseContext) {
  let columnList: Array<ColumnConfig<ColumnSpecData>> = [];
  switch (query.name) {
    case "pipeline": {
      let bindingName = ctx.bindingName;
      let pipeline = query.pipeline;
      let localPath = [];
      let skipAllowed = false;
      for (let i = 0; i < pipeline.length; i++) {
        if (pipeline[i].name === "navigate" && !ctx.suppressPath) {
          localPath = pipeline[i].path;
        }
        let nav = fromQueryImpl(pipeline[i], {
          ...ctx,
          bindingName,
          path: ctx.path.concat(localPath),
          suppressPath: false,
          currentStack: columnList
        });
        bindingName = null;
        if (nav.type !== "field" && skipAllowed) {
          break;
        }
        columnList = columnList.concat(
          nav.type === "stack" ? nav.columnList : nav
        );
        skipAllowed = !needDetailedColumn(nav, ctx.focusedSeq);
      }
      break;
    }
    case "aggregate": {
      const prev = ctx.currentStack != null ? ctx.currentStack.pop() : null;
      let dataKey = prev && prev.type === "field" ? prev.field.dataKey : ["0"];
      let label =
        prev && prev.type === "field" && prev.field.label
          ? query.aggregate === "count"
            ? "# " + prev.field.label
            : prev.field.label
          : query.aggregate;
      const sort =
        ctx.selectQuery != null &&
        ctx.selectQuery.sort != null &&
        ctx.selectQuery.sort.navigatePath.join(".") ===
          ctx.navigatePath.join(".")
          ? ctx.selectQuery.sort.dir
          : null;
      columnList.push({
        type: "field",
        id: "field:" + ctx.path.join("__"),
        field: {
          cellRenderer: DataTableColumnFormatter.cellRenderer,
          cellDataGetter,
          dataKey,
          label,
          sort,
          data: {
            query,
            navigatePath: ctx.navigatePath,
            navigateFromPipeline: ctx.navigateFromPipeline,
            pipeline: ctx.queryPipeline,
            select: ctx.selectQuery,
            navigate:
              prev != null && prev.type === "field"
                ? prev.field.data.navigate
                : null,
            type: query.context.type,
            focusedSeq: ctx.focusedSeq,
            focused: false
          }
        },
        size: { width: 1, height: 1 }
      });
      break;
    }
    case "navigate": {
      if (query.path in query.context.prev.scope) {
        let binding = query.context.prev.scope[query.path];
        return fromQueryImpl(binding.query, {
          ...ctx,
          queryPipeline: binding.query,
          navigateFromPipeline:
            binding.query.context.type.name === "record"
              ? binding.query
              : ctx.navigateFromPipeline,
          bindingName: binding.query.context.title || binding.name,
          suppressPath: true,
          currentStack: undefined
        });
      }
      let type = query.context.type;
      let focused =
        ctx.path.join(".") === ctx.focusedSeq.join(".") && type.card === "seq";
      const dataKey = ctx.path.length === 0 ? [query.path] : ctx.path;
      let sort = false;
      if (type.name !== "record") {
        sort =
          ctx.selectQuery != null &&
          ctx.selectQuery.sort != null &&
          ctx.selectQuery.sort.navigatePath.join(".") ===
            ctx.navigatePath.join(".")
            ? ctx.selectQuery.sort.dir
            : null;
      }
      columnList.push({
        type: "field",
        id:
          "field:" +
          (ctx.path.length === 0 ? [query.path] : ctx.path).join("__"),
        field: {
          cellRenderer: DataTableColumnFormatter.cellRenderer,
          cellDataGetter,
          dataKey,
          label: query.context.title || query.path,
          sort,
          data: {
            query,
            navigatePath: ctx.navigatePath,
            navigateFromPipeline: ctx.navigateFromPipeline,
            pipeline: ctx.queryPipeline,
            select: ctx.selectQuery,
            navigate: query,
            type,
            focusedSeq: ctx.focusedSeq,
            focused
          }
        },
        size: { width: 1, height: 1 }
      });
      break;
    }
    case "select":
      let group = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          group.push(
            fromQueryImpl(query.select[k], {
              ...ctx,
              selectQuery:
                ctx.queryPipeline.context.type.card === "seq"
                  ? query
                  : ctx.selectQuery,
              navigatePath:
                ctx.queryPipeline.context.type.card === "seq"
                  ? [k]
                  : ctx.navigatePath.concat(k),
              path: ctx.path.concat(k),
              bindingName: null,
              suppressPath: true,
              currentStack: undefined
            })
          );
        }
      }
      columnList.push({
        type: "group",
        id: "group:" + ctx.path.join("__"),
        columnList: group,
        size: {
          width: ArrayUtil.sum(group.map(c => c.size.width)),
          height: ArrayUtil.max(group.map(c => c.size.height))
        }
      });
      break;
    default:
      break;
  }

  // either unwrap a single element from a columnList or make a stack out of it
  return columnList.length === 1
    ? columnList[0]
    : {
        type: "stack",
        id: "stack:" + ctx.path.join("__"),
        columnList,
        size: {
          width: ArrayUtil.max(columnList.map(c => c.size.width)),
          height: ArrayUtil.sum(columnList.map(c => c.size.height))
        }
      };
}

function needDetailedColumn(
  column: ColumnConfig<*>,
  focusedSeq: Array<string>
) {
  if (
    column.type === "field" &&
    column.field.data.type &&
    column.field.data.type.card === "seq"
  ) {
    let focusedSeqPrefix = focusedSeq.slice(0, column.field.dataKey.length);
    return focusedSeqPrefix.join(".") === column.field.dataKey.join(".");
  } else {
    return true;
  }
}

function cellDataGetter({
  rowData,
  dataKey,
  columnData: { type, focusedSeq }
}) {
  let cellData =
    rowData != null && typeof rowData === "object"
      ? getDataByKey(rowData, dataKey, focusedSeq)
      : rowData;
  return cellData;
}
