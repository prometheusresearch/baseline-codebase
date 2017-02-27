/**
 * @flow
 */

import invariant from 'invariant';

import type {QueryPipeline} from '../model';
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
  zColumn: ?string,
};

export type ChartType = 'pie' | 'line' | 'bar' | 'scatter';

export type Chart = PieChart | LineChart | BarChart | ScatterChart;

export function getChartTitle({type}: {type: string}): string {
  switch (type) {
    case 'pie':
      return 'Pie Chart';
    case 'line':
      return 'Line Chart';
    case 'bar':
      return 'Bar Chart';
    case 'scatter':
      return 'Scatter Chart';
    default:
      invariant(false, 'Unknown chart type: %s', type);
  }
}

export function getInitialChart(pipeline: QueryPipeline, {type}: {type: string}): Chart {
  switch (type) {
    case 'pie':
      return {type: 'pie', labelColumn: getLabelColumn(pipeline), valueColumn: null};
    case 'line':
      return {type: 'line', labelColumn: getLabelColumn(pipeline), lineList: []};
    case 'bar':
      return {
        type: 'bar',
        labelColumn: getLabelColumn(pipeline),
        stacked: 'horizontal',
        barList: [],
      };
    case 'scatter':
      return {type: 'scatter', xColumn: null, yColumn: null, zColumn: null};
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
