/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import ChartTitle from './ChartTitle';
import * as model from './model';
import {getPipelineContext} from '../model';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import ChartControl from './ChartControl';
import NoNumericAttributeText from './NoNumericAttributeText';

type BarChartProps = {
  chart: model.BarChart,
  onChart: (model.Chart) => *,
  data: any,
  query: QueryPipeline,
  label: string,
  onLabel: (string) => *,
};

export default function BarChart(
  {label, onLabel, chart, onChart, data: rawData, query: pipeline}: BarChartProps,
) {
  const {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.labelColumn && chart.barList.length > 0) {
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
        <recharts.XAxis dataKey={chart.labelColumn} />
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
              fill={bar.color}
            />
          );
        })}
      </recharts.BarChart>
    );
  }
  const barList = chart.barList.concat({
    valueColumn: null,
    color: '#8884d8',
  });
  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          label="Label"
          value={chart.labelColumn}
          context={getPipelineContext(query)}
          onChange={labelColumn => onChart({type: 'bar', ...chart, labelColumn})}
        />
        {barList.map((bar, index) => {
          const updateBar = values => {
            const barList = chart.barList.slice(0);
            if (values.valueColumn === null) {
              barList.splice(index, 1);
            } else {
              barList.splice(index, 1, {
                ...barList[index],
                ...values,
              });
            }
            onChart({type: 'bar', ...chart, barList});
          };
          return (
            <SelectAttributeWithColor
              key={index}
              label="Bar"
              noValueLabel="Add new bar"
              noResultsText={<NoNumericAttributeText />}
              context={getPipelineContext(query)}
              value={bar.valueColumn}
              onChange={valueColumn => updateBar({...bar, valueColumn})}
              color={bar.color}
              onColorChange={color => updateBar({...bar, color})}
              onlyNumerics={true}
              addSumarizations={true}
            />
          );
        })}
        {chart.barList.length > 1 &&
          <ChartControl
            label="Stack vertically"
            control={
              <ReactUI.Checkbox
                value={chart.stacked === 'vertical'}
                onChange={vertical =>
                  onChart({
                    type: 'bar',
                    ...chart,
                    stacked: vertical ? 'vertical' : 'horizontal',
                  })}
              />
            }
          />}
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        {rendered}
      </VBox>
    </VBox>
  );
}

function getBarChartKey(chart: BarChart): string {
  return `${chart.stacked}:${chart.barList
    .map(bar => `${bar.valueColumn}--${bar.color}`)
    .join(':')}`;
}
