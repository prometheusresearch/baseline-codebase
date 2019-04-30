/**
 * @flow
 */

import type {
  Context,
  QueryAtom,
  QueryPipeline,
  QueryNavigation,
  DomainAttributeMap,
  ChartConfig
} from "../model/types";
import type {
  Chart,
  LineChart,
  PieChart,
  BarChart,
  AreaChart,
  ScatterChart
} from "../charting/types";

import invariant from "invariant";

import type { SelectOptionWithStringLabel } from "../ui";
import * as t from "../model/Type";
import { getNavigation } from "../model/QueryNavigation";

export function getChartTitle(chart: Chart, pipeline: QueryPipeline): string {
  const chart_ = chart;
  switch (chart_.type) {
    case "pie": {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getPieChartDesc(query, chart_)
      );
      return desc == null ? "Pie Chart" : `${desc} — Pie Chart`;
    }
    case "line": {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getLineChartDesc(query, chart_)
      );
      return desc == null ? "Line Chart" : `${desc} — Line Chart`;
    }
    case "bar": {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getBarChartDesc(query, chart_)
      );
      return desc == null ? "Bar Chart" : `${desc} — Bar Chart`;
    }
    case "area": {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getAreaChartDesc(query, chart_)
      );
      return desc == null ? "Area Chart" : `${desc} — Area Chart`;
    }
    case "scatter": {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getScatterChartDesc(query, chart_)
      );
      return desc == null ? "Scatter Chart" : `${desc} — Scatter Chart`;
    }
    default:
      invariant(false, "Unknown chart type: %s", chart_.type);
  }
}

export function withRecordAttributesOrNull(
  pipeline: QueryPipeline,
  f: DomainAttributeMap => ?string
): ?string {
  const { query } = getQuery(pipeline);
  if (query == null) {
    return null;
  }
  if (!t.isRecord(query.context.type)) {
    return null;
  }
  const attrs = t.recordLikeAttribute(query.context.type);
  return f(attrs);
}

export function getValueLabel<T: { valueColumn: ?string }>(
  attrs: DomainAttributeMap,
  list: T[]
) {
  const value = [];
  for (const { valueColumn } of list) {
    if (valueColumn == null) {
      continue;
    }
    const attr = attrs[valueColumn];
    if (attr == null) {
      continue;
    }
    value.push(attr.title);
  }
  return value;
}

export function getChartDesc(
  attrs: DomainAttributeMap,
  labelColumn: ?string,
  valueList: Array<string>
): ?string {
  if (labelColumn == null || !(labelColumn in attrs)) {
    return null;
  }
  const label = attrs[labelColumn].title;
  if (valueList.length === 0) {
    return null;
  }
  return `${valueList.join(", ")} by ${label}`;
}

function getLineChartDesc(
  attrs,
  { labelColumn, lineList }: LineChart
): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, lineList));
}

function getBarChartDesc(attrs, { labelColumn, barList }: BarChart): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, barList));
}

function getAreaChartDesc(
  attrs,
  { labelColumn, areaList }: AreaChart
): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, areaList));
}

function getPieChartDesc(
  attrs,
  { labelColumn, valueColumn }: PieChart
): ?string {
  return getChartDesc(
    attrs,
    labelColumn,
    getValueLabel(attrs, [{ valueColumn }])
  );
}

function getScatterChartDesc(
  attrs,
  { xColumn, yColumn }: ScatterChart
): ?string {
  if (
    xColumn == null ||
    yColumn == null ||
    !(xColumn in attrs) ||
    !(yColumn in attrs)
  ) {
    return null;
  }
  const yLabel = attrs[yColumn].title;
  const xLabel = attrs[xColumn].title;
  return `${yLabel}, ${xLabel}`;
}

export function getInitialChart(
  pipeline: QueryPipeline,
  { type }: { type: string }
): Chart {
  switch (type) {
    case "pie":
      return {
        type: "pie",
        labelColumn: getLabelColumn(pipeline),
        valueColumn: null,
        color: {}
      };
    case "line":
      return {
        type: "line",
        labelColumn: getLabelColumn(pipeline),
        lineList: []
      };
    case "area":
      return {
        type: "area",
        labelColumn: getLabelColumn(pipeline),
        areaList: []
      };
    case "bar":
      return {
        type: "bar",
        labelColumn: getLabelColumn(pipeline),
        stacked: "horizontal",
        barList: []
      };
    case "scatter":
      return {
        type: "scatter",
        xColumn: null,
        xLabel: null,
        yColumn: null,
        yLabel: null
      };
    default:
      invariant(false, "Unknown chart type: %s", type);
  }
}

export function getSelectOptionsFromContext(
  context: Context,
  params?: {
    onlyNumerics?: boolean,
    addSumarizations?: boolean
  } = {}
): $ReadOnlyArray<SelectOptionWithStringLabel> {
  const { onlyNumerics, addSumarizations } = params;
  const navigation = Array.from(getNavigation(context).values());
  const options = [];

  for (let i = 0; i < navigation.length; i++) {
    const nav = navigation[i];

    if (addSumarizations && nav.card === "seq") {
      options.push({
        label: "# " + nav.label,
        value: nav.value
      });
    }

    if (onlyNumerics && !isNumericNav(nav)) {
      continue;
    }

    options.push({
      label: nav.label,
      value: nav.value
    });
  }

  return options;
}

function isNumericNav(nav: QueryNavigation): boolean {
  return (
    (nav.card == null || nav.card === "opt") &&
    nav.context.type.name === "number"
  );
}

const COLUMN_AS_LABEL_TO_CONSIDER = {
  title: true,
  name: true,
  fullname: true
};

export function getLabelColumn(pipeline: QueryPipeline): ?string {
  const { query } = getQuery(pipeline);
  if (query == null) {
    return null;
  }
  const nav = getNavigation(query.context);
  for (let item of nav.values()) {
    // only consider regular cardinality navs
    if (item.card == null && COLUMN_AS_LABEL_TO_CONSIDER[item.value]) {
      return item.value;
    }
  }
  return null;
}

import { inferTypeAtPath, aggregate } from "../model/Query";
import { editor } from "../model/QueryOperation";

export function getColumnOptions(
  context: Context
): $ReadOnlyArray<{ label: string, value: string }> {
  const nav = getNavigation(context);
  return Array.from(nav.values()).map(nav => ({
    label: nav.label,
    value: nav.value
  }));
}

export function getQuery(
  query: QueryPipeline,
  data: any
): { query: ?QueryPipeline, data: any } {
  if (query.pipeline.length === 1) {
    return { query: null, data };
  } else {
    if (query.pipeline[1].name === "define") {
      if (data != null) {
        data = data[Object.keys(data)[0]];
      }
      return { query: query.pipeline[1].binding.query, data };
    } else {
      return { query: null, data };
    }
  }
}

export function enrichQuery(
  query: QueryPipeline,
  chart: Chart,
  chartConfig: ChartConfig<>
): QueryPipeline {
  const focus = getQuery(query, null).query;
  if (focus == null) {
    return query;
  }
  let e = editor(query, focus);
  for (const attrName of chartConfig.getUsedAttributes(chart)) {
    let editAtCompletion;
    const type = inferTypeAtPath(focus.context.prev, [attrName]);
    if (type.card === "seq" && type.name === "record" && type.entity != null) {
      editAtCompletion = ensurePipelineHasCount;
    }
    e = e.growNavigation({ path: [attrName], editAtCompletion });
  }
  return e.getQuery();
}

function ensurePipelineHasCount(pipe: QueryAtom[]): QueryAtom[] {
  const last = pipe[pipe.length - 1];
  if (last != null && last.name === "aggregate") {
    return pipe;
  } else {
    return pipe.concat(aggregate("count"));
  }
}
