/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import invariant from 'invariant';

import * as t from '../model/Type';
import {getNavigation} from '../model/QueryNavigation';
import {getQuery} from './util';

export type PieChart = {
  type: 'pie',
  labelColumn: ?string,
  valueColumn: ?string,
  color: {[label: string]: string},
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
        getPieChartDesc(query, chart_),
      );
      return desc == null ? 'Pie Chart' : `${desc} — Pie Chart`;
    }
    case 'line': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getLineChartDesc(query, chart_),
      );
      return desc == null ? 'Line Chart' : `${desc} — Line Chart`;
    }
    case 'bar': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getBarChartDesc(query, chart_),
      );
      return desc == null ? 'Bar Chart' : `${desc} — Bar Chart`;
    }
    case 'area': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getAreaChartDesc(query, chart_),
      );
      return desc == null ? 'Area Chart' : `${desc} — Area Chart`;
    }
    case 'scatter': {
      const desc = withRecordAttributesOrNull(pipeline, query =>
        getScatterChartDesc(query, chart_),
      );
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
  if (!t.isRecord(query.context.type)) {
    return null;
  }
  const attrs = t.recordLikeAttribute(query.context.type);
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

function getChartDesc(attrs, labelColumn, valueList): ?string {
  if (labelColumn == null || !(labelColumn in attrs)) {
    return null;
  }
  const label = attrs[labelColumn].title;
  if (valueList.length === 0) {
    return null;
  }
  return `${valueList.join(', ')} by ${label}`;
}

function getLineChartDesc(attrs, {labelColumn, lineList}: LineChart): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, lineList));
}

function getBarChartDesc(attrs, {labelColumn, barList}: BarChart): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, barList));
}

function getAreaChartDesc(attrs, {labelColumn, areaList}: AreaChart): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, areaList));
}

function getPieChartDesc(attrs, {labelColumn, valueColumn}: PieChart): ?string {
  return getChartDesc(attrs, labelColumn, getValueLabel(attrs, [{valueColumn}]));
}

function getScatterChartDesc(attrs, {xColumn, yColumn}: ScatterChart): ?string {
  if (xColumn == null || yColumn == null || !(xColumn in attrs) || !(yColumn in attrs)) {
    return null;
  }
  const yLabel = attrs[yColumn].title;
  const xLabel = attrs[xColumn].title;
  return `${yLabel}, ${xLabel}`;
}

export function getInitialChart(pipeline: QueryPipeline, {type}: {type: string}): Chart {
  switch (type) {
    case 'pie':
      return {
        type: 'pie',
        labelColumn: getLabelColumn(pipeline),
        valueColumn: null,
        color: {},
      };
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

export function getUsedAttributes(chart: Chart): Set<string> {
  const attributes = new Set();
  const add = column => {
    if (column != null) {
      attributes.add(column);
    }
  };
  switch (chart.type) {
    case 'pie':
      add(chart.labelColumn);
      add(chart.valueColumn);
      break;
    case 'line':
      add(chart.labelColumn);
      for (const {valueColumn} of chart.lineList) {
        add(valueColumn);
      }
      break;
    case 'area':
      add(chart.labelColumn);
      for (const {valueColumn} of chart.areaList) {
        add(valueColumn);
      }
      break;
    case 'bar':
      add(chart.labelColumn);
      for (const {valueColumn} of chart.barList) {
        add(valueColumn);
      }
      break;
    case 'scatter':
      add(chart.xColumn);
      add(chart.yColumn);
      break;
    default:
      invariant(false, 'Unknown chart type: %s', chart.type);
  }
  return attributes;
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
