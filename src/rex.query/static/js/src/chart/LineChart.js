/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import ChartTitle from './ChartTitle';
import * as model from './model';
import {getPipelineContext} from '../model';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import NoNumericAttributeText from './NoNumericAttributeText';

type LineChartProps = {
  label: string,
  onLabel: (string) => *,
  chart: model.LineChart,
  onChart: (model.Chart) => *,
  data: any,
  query: QueryPipeline,
};

export default function LineChart(
  {label, onLabel, chart, onChart, data: rawData, query: pipeline}: LineChartProps,
) {
  const {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.labelColumn && chart.lineList.length > 0) {
    rendered = (
      <recharts.LineChart
        key={getLineChartKey(chart)}
        data={data}
        width={600}
        height={400}
        style={{fontWeight: 200, fontSize: '9pt'}}
        margin={{top: 50, right: 30, left: 20, bottom: 5}}>
        <g>
          <ChartTitle left={300} value={label} onChange={onLabel} />
        </g>
        <recharts.XAxis dataKey={chart.labelColumn} />
        <recharts.YAxis />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip />
        <recharts.Legend />
        {chart.lineList.map(line => {
          return (
            <recharts.Line
              key={line.valueColumn}
              dataKey={line.valueColumn}
              type="monotone"
              stroke={line.color}
            />
          );
        })}
      </recharts.LineChart>
    );
  }
  const lineList = chart.lineList.concat({
    valueColumn: null,
    color: '#8884d8',
  });
  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          label="X axis"
          value={chart.labelColumn}
          context={getPipelineContext(query)}
          onChange={labelColumn => onChart({type: 'line', ...chart, labelColumn})}
        />
        {lineList.map((line, index) => {
          const updateChart = (values: model.Line) => {
            const lineList = chart.lineList.slice(0);
            if (values.valueColumn === null) {
              lineList.splice(index, 1);
            } else {
              lineList.splice(index, 1, {
                ...lineList[index],
                ...values,
              });
            }
            onChart({type: 'line', ...chart, lineList});
          };
          return (
            <SelectAttributeWithColor
              key={index}
              label="Line"
              noValueLabel="Add new line"
              noResultsText={<NoNumericAttributeText />}
              context={getPipelineContext(query)}
              value={line.valueColumn}
              onChange={valueColumn => updateChart({...line, valueColumn})}
              color={line.color}
              onlyNumerics={true}
              addSumarizations={true}
              onColorChange={color => updateChart({...line, color})}
            />
          );
        })}
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        {rendered}
      </VBox>
    </VBox>
  );
}

function getLineChartKey(chart: LineChart): string {
  return chart.lineList.map(bar => `${bar.valueColumn}--${bar.color}`).join(':');
}
