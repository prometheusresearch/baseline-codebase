/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import * as model from './model';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';

type ScatterChartProps = {
  chart: model.ScatterChart,
  onChart: (model.Chart) => *,
  data: any,
  query: QueryPipeline,
};

export default function ScatterChart(
  {chart, onChart, data: rawData, query: pipeline}: ScatterChartProps,
) {
  let {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.xColumn && chart.yColumn) {
    rendered = (
      <recharts.ScatterChart width={600} height={400}>
        <recharts.XAxis dataKey={chart.xColumn} name={chart.xColumn} />
        <recharts.YAxis dataKey={chart.yColumn} name={chart.yColumn} />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip cursor={{strokeDasharray: '3 3'}} />
        <recharts.Legend />
        <recharts.Scatter data={data} fill="#8884d8" />
      </recharts.ScatterChart>
    );
  }
  return (
    <VBox overflow="visible" flexGrow={1}>
      <VBox overflow="visible" marginBottom={10}>
        <SelectAttribute
          label="X axis"
          value={chart.xColumn}
          context={query.context}
          onChange={xColumn => onChart({type: 'scatter', ...chart, xColumn})}
        />
        <SelectAttribute
          label="Y axis"
          value={chart.yColumn}
          context={query.context}
          onChange={yColumn => onChart({type: 'scatter', ...chart, yColumn})}
        />
      </VBox>
      <VBox flexGrow={1}>
        {rendered}
      </VBox>
    </VBox>
  );
}
