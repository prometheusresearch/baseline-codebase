/**
 * @flow
 */

import * as types from './types';

import * as React from 'react';
import * as recharts from 'recharts';
import {Element, VBox, HBox} from 'react-stylesheet';
import {SwatchColorPicker} from '@prometheusresearch/react-ui';

import {COLOR_LIST} from './ColorList';
import * as ui from '../ui';
import SelectAttribute from './SelectAttribute';
import ChartControlPanel from './ChartControlPanel';
import ChartControl from './ChartControl';
import NoNumericAttributeText from './NoNumericAttributeText';
import generateColorHash from '../generateColorHash';
import PieChart from './PieChart';

const RADIAN = Math.PI / 180;

const getPieColor = (chart: types.PieChart, id: string) =>
  chart.color[id] || generateColorHash(id);

type PieChartEditorProps = types.ChartEditorBaseProps<types.PieChart> & {
  optionsForLabel: Array<ui.SelectOption>,
  optionsForValue: Array<ui.SelectOption>,
};

export default class PieChartEditor extends React.Component {
  props: PieChartEditorProps;
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
    const {
      label,
      onLabel,
      chart,
      onChart,
      data,
      optionsForLabel,
      optionsForValue,
      dataIsUpdating,
    } = this.props;
    const {activeIndex} = this.state;
    const activeEntry = activeIndex != null && data != null ? data[activeIndex] : null;
    return (
      <VBox overflow="visible" flexGrow={1} fontWeight={200}>
        <ChartControlPanel>
          <SelectAttribute
            options={optionsForLabel}
            label="Label"
            value={chart.labelColumn}
            onChange={labelColumn => onChart({type: 'pie', ...chart, labelColumn})}
          />
          <SelectAttribute
            options={optionsForValue}
            label="Value"
            value={chart.valueColumn}
            noResultsText={<NoNumericAttributeText />}
            onChange={valueColumn => onChart({type: 'pie', ...chart, valueColumn})}
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
        <PieChart
          label={label}
          onLabel={onLabel}
          chart={chart}
          data={data}
          dataIsUpdating={dataIsUpdating}
          activeIndex={activeIndex}
          onSectorClick={this.onSectorClick}
        />
      </VBox>
    );
  }
}
