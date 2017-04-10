/**
 * @flow
 */

import invariant from 'invariant';

import type {QueryPipeline} from '../model';
import * as T from '../model/Type';
import {getNavigation} from '../model/QueryNavigation';
import {getQuery} from './util';

export type PieChart = {
  type: 'pie',
  labelColumn: ?string,
  valueColumn: ?string,
};

export type Line = {
  valueColumn: ?string,
  color: string,
};

export type LineChart = {
  type: 'line',
  labelColumn: ?string,
  lineList: Array<Line>,
};

export type Area = {
  valueColumn: ?string,
  color: string,
};

export type AreaChart = {
  type: 'area',
  labelColumn: ?string,
  areaList: Array<Area>,
};

export type Bar = {
  valueColumn: ?string,
  color: string,
};

export type BarChart = {
  type: 'bar',
  labelColumn: ?string,
  stacked: 'horizontal' | 'vertical',
  barList: Array<Bar>,
};

export type ScatterChart = {
  type: 'scatter',
  xColumn: ?string,
  yColumn: ?string,
};

export type ChartType = 'pie' | 'line' | 'bar' | 'scatter' | 'area';

export type Chart = PieChart | LineChart | BarChart | ScatterChart | AreaChart;

export function getChartTitle(chart: Chart, pipeline: QueryPipeline): string {
  const chart_ = chart;
  switch (chart_.type) {
    case 'pie': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getPieChartDesc(query, chart_));
      return desc == null ? 'Pie Chart' : `${desc} — Pie Chart`;
    }
    case 'line': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getLineChartDesc(query, chart_));
      return desc == null ? 'Line Chart' : `${desc} — Line Chart`;
    }
    case 'bar': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getBarChartDesc(query, chart_));
      return desc == null ? 'Bar Chart' : `${desc} — Bar Chart`;
    }
    case 'area': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getAreaChartDesc(query, chart_));
      return desc == null ? 'Area Chart' : `${desc} — Area Chart`;
    }
    case 'scatter': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getScatterChartDesc(query, chart_));
      return desc == null ? 'Scatter Chart' : `${desc} — Scatter Chart`;
    }
    default:
      invariant(false, 'Unknown chart type: %s', chart_.type);
  }
}

function withRecordAttributesOrNull(pipeline, f) {
  const {query} = getQuery(pipeline);
  if (query == null) {
    return null;
  }
  if (query.context.type.name !== 'record') {
    return null;
  }
  const attrs = T.recordAttribute(query.context.type);
  return f(attrs);
}

function getValueLabel<T: {valueColumn: ?string}>(attrs, list: T[]) {
  const value = [];
  for (const {valueColumn} of list) {
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

function getLineChartDesc(attrs, {labelColumn, lineList}: LineChart): ?string {
  if (labelColumn == null) {
    return null;
  }
  const label = attrs[labelColumn].title;
  const value = getValueLabel(attrs, lineList);
  return `${value.join(', ')} by ${label}`;
}

function getBarChartDesc(attrs, {labelColumn, barList}: BarChart): ?string {
  if (labelColumn == null) {
    return null;
  }
  const label = attrs[labelColumn].title;
  const value = getValueLabel(attrs, barList);
  return `${value.join(', ')} by ${label}`;
}

function getAreaChartDesc(attrs, {labelColumn, areaList}: AreaChart): ?string {
  if (labelColumn == null) {
    return null;
  }
  const label = attrs[labelColumn].title;
  const value = getValueLabel(attrs, areaList);
  return `${value.join(', ')} by ${label}`;
}

function getPieChartDesc(attrs, {labelColumn, valueColumn}: PieChart): ?string {
  if (labelColumn == null) {
    return null;
  }
  const label = attrs[labelColumn].title;
  const value = getValueLabel(attrs, [{valueColumn}]);
  return `${value.join(', ')} by ${label}`;
}

function getScatterChartDesc(attrs, {xColumn, yColumn}: ScatterChart): ?string {
  if (xColumn == null || yColumn == null) {
    return null;
  }
  const yLabel = attrs[yColumn].title;
  const xLabel = attrs[xColumn].title;
  return `${yLabel}, ${xLabel}`;
}

export function getInitialChart(pipeline: QueryPipeline, {type}: {type: string}): Chart {
  switch (type) {
    case 'pie':
      return {type: 'pie', labelColumn: getLabelColumn(pipeline), valueColumn: null};
    case 'line':
      return {type: 'line', labelColumn: getLabelColumn(pipeline), lineList: []};
    case 'area':
      return {type: 'area', labelColumn: getLabelColumn(pipeline), areaList: []};
    case 'bar':
      return {
        type: 'bar',
        labelColumn: getLabelColumn(pipeline),
        stacked: 'horizontal',
        barList: [],
      };
    case 'scatter':
      return {type: 'scatter', xColumn: null, yColumn: null};
    default:
      invariant(false, 'Unknown chart type: %s', type);
  }
}

const COLUMN_AS_LABEL_TO_CONSIDER = {
  title: true,
  name: true,
  fullname: true,
};

function getLabelColumn(pipeline: QueryPipeline): ?string {
  const {query} = getQuery(pipeline);
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
