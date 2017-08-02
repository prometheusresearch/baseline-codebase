/**
 * @flow
 */

import * as types from './types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import ChartTitle from './ChartTitle';
import Preloader from './Preloader';
import NoDataMessage from './NoDataMessage';

type ScatterChartProps = types.ChartBaseProps<types.ScatterChart>;

export default function ScatterChart({
  label,
  onLabel,
  chart,
  data,
  dataIsUpdating,
}: ScatterChartProps) {
  let rendered = null;
  if (dataIsUpdating) {
    rendered = <Preloader />;
  } else if (data == null) {
    rendered = <NoDataMessage />;
  } else if (chart.xColumn != null && chart.yColumn != null) {
    rendered = (
      <recharts.ScatterChart
        width={600}
        height={400}
        margin={{top: 50, right: 30, left: 20, bottom: 5}}
        style={{fontWeight: 200, fontSize: '9pt'}}>
        <g>
          <ChartTitle left={300} value={label} onChange={onLabel} />
        </g>
        <recharts.XAxis dataKey={chart.xColumn} name={chart.xLabel} />
        <recharts.YAxis dataKey={chart.yColumn} name={chart.yLabel} />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip cursor={{strokeDasharray: '3 3'}} />
        <recharts.Legend />
        <recharts.Scatter data={data} fill="#8884d8" />
      </recharts.ScatterChart>
    );
  }
  return (
    <VBox flexGrow={1} alignItems="center">
      {rendered}
    </VBox>
  );
}
