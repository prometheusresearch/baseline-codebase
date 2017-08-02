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

type BarChartProps = types.ChartBaseProps<types.BarChart>;

export default function BarChart({
  label,
  onLabel,
  chart,
  data,
  dataIsUpdating,
}: BarChartProps) {
  let rendered = null;
  if (dataIsUpdating) {
    rendered = <Preloader />;
  } else if (data == null) {
    rendered = <NoDataMessage />;
  } else if (chart.labelColumn != null && chart.barList.length > 0) {
    rendered = (
      <recharts.BarChart
        key={getBarChartKey(chart)}
        data={data}
        width={600}
        height={400}
        style={{fontWeight: 200, fontSize: '9pt'}}
        margin={{top: 50}}>
        <g>
          <ChartTitle left={300} value={label} onChange={onLabel} />
        </g>
        <recharts.XAxis dataKey={String(chart.labelColumn)} name={chart.label} />
        <recharts.YAxis />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip />
        <recharts.Legend />
        {chart.barList.map(bar => {
          return (
            <recharts.Bar
              stackId={chart.stacked === 'vertical' ? 'single' : undefined}
              key={bar.valueColumn}
              dataKey={bar.valueColumn}
              name={bar.label}
              fill={bar.color}
            />
          );
        })}
      </recharts.BarChart>
    );
  }
  return (
    <VBox flexGrow={1} alignItems="center">
      {rendered}
    </VBox>
  );
}

function getBarChartKey(chart: BarChart): string {
  return `${chart.stacked}:${chart.barList
    .map(bar => `${bar.valueColumn}--${bar.color}`)
    .join(':')}`;
}
