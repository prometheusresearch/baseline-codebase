/**
 * @flow
 */

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import * as model from './model';
import {type QueryPipeline, getPipelineContext} from '../model';
import {getQuery, isNumericNav} from './util';
import SelectAttribute from './SelectAttribute';
import ChartControlPanel from './ChartControlPanel';

const RADIAN = Math.PI / 180;

const PieChartLabel = ({cx, cy, midAngle, outerRadius, percent, name}) => {
  const radius = outerRadius + 23;
  const x = cx + radius * Math.cos((-midAngle) * RADIAN);
  const y = cy + radius * Math.sin((-midAngle) * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#8884d8"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central">
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

type PieChartProps = {
  chart: model.PieChart,
  onChart: (model.Chart) => *,
  data: any,
  query: QueryPipeline,
};

export default function PieChart(
  {chart, onChart, data: rawData, query: pipeline}: PieChartProps,
) {
  let {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.labelColumn && chart.valueColumn) {
    rendered = (
      <recharts.PieChart width={600} height={400}>
        <recharts.Pie
          data={data}
          nameKey={chart.labelColumn}
          valueKey={chart.valueColumn}
          outerRadius={130}
          fill="#8884d8"
          label={PieChartLabel}
        />
      </recharts.PieChart>
    );
  }
  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          label="Label"
          value={chart.labelColumn}
          context={getPipelineContext(query)}
          onChange={labelColumn => onChart({type: 'pie', ...chart, labelColumn})}
        />
        <SelectAttribute
          label="Value"
          value={chart.valueColumn}
          context={getPipelineContext(query)}
          onChange={valueColumn => onChart({type: 'pie', ...chart, valueColumn})}
          filter={isNumericNav}
        />
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        {rendered}
      </VBox>
    </VBox>
  );
}
