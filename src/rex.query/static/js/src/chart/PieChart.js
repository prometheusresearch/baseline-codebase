/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import * as model from './model';
import {getPipelineContext} from '../model';
import ChartTitle from './ChartTitle';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import NoNumericAttributeText from './NoNumericAttributeText';

const RADIAN = Math.PI / 180;

const PieChartLabel = ({cx, cy, midAngle, outerRadius, percent, name}) => {
  const radius = outerRadius + 23;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      style={{fontWeight: 200, fontSize: '9pt'}}
      x={x}
      y={y}
      fill="#222222"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central">
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

type PieChartProps = {
  chart: model.PieChart,
  onChart: (model.Chart) => *,
  label: string,
  onLabel: (string) => *,
  data: any,
  query: QueryPipeline,
};

export default function PieChart(
  {label, onLabel, chart, onChart, data: rawData, query: pipeline}: PieChartProps,
) {
  let {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.labelColumn && chart.valueColumn) {
    const width = 600;
    const height = 400;
    rendered = (
      <recharts.PieChart width={width} height={height}>
        <g>
          <ChartTitle left="300" value={label} onChange={onLabel} />
        </g>
        <recharts.Pie
          data={data}
          nameKey={chart.labelColumn}
          valueKey={chart.valueColumn}
          outerRadius={130}
          fill={chart.color}
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
        <SelectAttributeWithColor
          label="Value"
          value={chart.valueColumn}
          noResultsText={<NoNumericAttributeText />}
          context={getPipelineContext(query)}
          onChange={valueColumn => onChart({type: 'pie', ...chart, valueColumn})}
          onlyNumerics={true}
          addSumarizations={true}
          color={chart.color}
          onColorChange={color => onChart({type: 'pie', ...chart, color})}
        />
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        {rendered}
      </VBox>
    </VBox>
  );
}
