/**
 * @flow
 */

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import * as model from './model';
import {type QueryPipeline, getPipelineContext} from '../model';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import NoNumericAttributeText from './NoNumericAttributeText';

type AreaChartProps = {
  chart: model.AreaChart,
  onChart: (model.Chart) => *,
  data: any,
  query: QueryPipeline,
};

export default function AreaChart(
  {chart, onChart, data: rawData, query: pipeline}: AreaChartProps,
) {
  const {query, data} = getQuery(pipeline, rawData);
  if (query == null) {
    return null;
  }
  let rendered = null;
  if (chart.labelColumn && chart.areaList.length > 0) {
    rendered = (
      <recharts.AreaChart
        key={getAreaChartKey(chart)}
        data={data}
        width={600}
        height={400}
        margin={{top: 5, right: 30, left: 20, bottom: 5}}>
        <recharts.XAxis dataKey={chart.labelColumn} />
        <recharts.YAxis />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip />
        <recharts.Legend />
        {chart.areaList.map(area => {
          return (
            <recharts.Area
              key={area.valueColumn}
              dataKey={area.valueColumn}
              stroke={area.color}
              fill={area.color}
              fillOpacity={0.6}
            />
          );
        })}
      </recharts.AreaChart>
    );
  }
  const areaList = chart.areaList.concat({
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
          onChange={labelColumn => onChart({type: 'area', ...chart, labelColumn})}
        />
        {areaList.map((area, index) => {
          const updateChart = (values: model.Line) => {
            const areaList = chart.areaList.slice(0);
            if (values.valueColumn === null) {
              areaList.splice(index, 1);
            } else {
              areaList.splice(index, 1, {
                ...areaList[index],
                ...values,
              });
            }
            onChart({type: 'area', ...chart, areaList});
          };
          return (
            <SelectAttributeWithColor
              key={index}
              label="Line"
              noValueLabel="Add new area"
              noResultsText={<NoNumericAttributeText />}
              context={getPipelineContext(query)}
              value={area.valueColumn}
              onChange={valueColumn => updateChart({...area, valueColumn})}
              color={area.color}
              onlyNumerics={true}
              addSumarizations={true}
              onColorChange={color => updateChart({...area, color})}
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

function getAreaChartKey(chart: AreaChart): string {
  return chart.areaList.map(item => `${item.valueColumn}--${item.color}`).join(':');
}
