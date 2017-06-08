/**
 * @flow
 */

import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import * as recharts from 'recharts';
import {Element, VBox, HBox} from 'react-stylesheet';
import {SwatchColorPicker} from '@prometheusresearch/react-ui';

import {COLOR_LIST} from './ColorList';
import * as model from './model';
import {getPipelineContext} from '../model';
import ChartTitle from './ChartTitle';
import {getQuery} from './util';
import SelectAttribute from './SelectAttribute';
import ChartControlPanel from './ChartControlPanel';
import ChartControl from './ChartControl';
import NoNumericAttributeText from './NoNumericAttributeText';
import generateColorHash from '../generateColorHash';

const RADIAN = Math.PI / 180;

const getPieColor = (chart: model.PieChart, id: string) =>
  chart.color[id] || generateColorHash(id);

type PieChartProps = {
  chart: model.PieChart,
  onChart: model.Chart => *,
  label: string,
  onLabel: string => *,
  data: any,
  query: QueryPipeline,
};

export default class PieChart extends React.Component {
  props: PieChartProps;
  state: {activeIndex: ?number} = {activeIndex: null};

  onSectorClick = (activeIndex: number) => {
    this.setState(state => {
      if (state.activeIndex === activeIndex) {
        return {...state, activeIndex: null};
      } else {
        return {...state, activeIndex};
      }
    });
  };

  onSectorColor = (active: string, color: string) => {
    const {chart} = this.props;
    const nextChart = {...chart, color: {...chart.color, [active]: color}};
    this.props.onChart(nextChart);
  };

  label = ({cx, cy, midAngle, outerRadius, percent, name, index}: any) => {
    if (index === this.state.activeIndex) {
      return null;
    }
    const radius = outerRadius + 23;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <recharts.Text
        style={{fontWeight: 200, fontSize: '9pt'}}
        width={80}
        x={x}
        y={y}
        fill={getPieColor(this.props.chart, name)}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </recharts.Text>
    );
  };

  activeShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      percent,
      name,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    return (
      <g>
        <recharts.Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <recharts.Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <recharts.Text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          width={90}
          textAnchor={textAnchor}
          fill={fill}>
          {`${name} (${(percent * 100).toFixed(2)}%)`}
        </recharts.Text>
      </g>
    );
  };

  render() {
    const {label, onLabel, chart, onChart, data: rawData, query: pipeline} = this.props;
    let {activeIndex} = this.state;
    const {query, data} = getQuery(pipeline, rawData);
    const activeEntry = data[activeIndex];
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
            isAnimationActive={false}
            data={data}
            nameKey={chart.labelColumn}
            valueKey={chart.valueColumn}
            outerRadius={130}
            activeIndex={activeIndex}
            activeShape={this.activeShape}
            label={this.label}>
            {data.map((entry, index) => {
              const id = entry[chart.labelColumn];
              return (
                <recharts.Cell
                  key={id}
                  fill={getPieColor(chart, id)}
                  onClick={this.onSectorClick.bind(null, index)}
                />
              );
            })}
          </recharts.Pie>
        </recharts.PieChart>
      );
    }
    return (
      <VBox overflow="visible" flexGrow={1} fontWeight={200}>
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
            noResultsText={<NoNumericAttributeText />}
            context={getPipelineContext(query)}
            onChange={valueColumn => onChart({type: 'pie', ...chart, valueColumn})}
            onlyNumerics={true}
            addSumarizations={true}
          />
          <ChartControl
            label="Currently selected sector"
            hint="Click on a sector in a pie chart to select and customize the colour"
            control={
              activeEntry &&
              <HBox overflow="visible">
                <SwatchColorPicker
                  colorList={COLOR_LIST}
                  value={getPieColor(chart, activeEntry[chart.labelColumn])}
                  onChange={this.onSectorColor.bind(null, activeEntry[chart.labelColumn])}
                />
                <Element fontSize="10pt" padding={4}>
                  {activeEntry[chart.labelColumn]}
                </Element>
              </HBox>
            }
          />
        </ChartControlPanel>
        <VBox flexGrow={1} alignItems="center">
          {rendered}
        </VBox>
      </VBox>
    );
  }
}
