/**
 * @flow
 */

import * as types from "./types";

import * as React from "react";
import * as recharts from "recharts";
import { VBox } from "react-stylesheet";

import ChartTitle from "./ChartTitle";
import Preloader from "./Preloader";
import NoDataMessage from "./NoDataMessage";
import generateColorHash from "../generateColorHash";

const RADIAN = Math.PI / 180;

const getPieColor = (chart: types.PieChart, id: string) =>
  chart.color[id] || generateColorHash(id);

type PieChartProps = types.ChartBaseProps<types.PieChart> & {
  onSectorClick?: number => *,
  activeIndex: ?number
};

export default class PieChart extends React.Component<PieChartProps> {
  label = ({ cx, cy, midAngle, outerRadius, percent, name, index }: any) => {
    if (index === this.props.activeIndex) {
      return null;
    }
    const radius = outerRadius + 23;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <recharts.Text
        style={{ fontWeight: 200, fontSize: "9pt" }}
        width={80}
        x={x}
        y={y}
        fill={getPieColor(this.props.chart, name)}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
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
      name
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";
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
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <recharts.Text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          width={90}
          textAnchor={textAnchor}
          fill={fill}
        >
          {`${name} (${(percent * 100).toFixed(2)}%)`}
        </recharts.Text>
      </g>
    );
  };

  render() {
    const {
      chart,
      data,
      dataIsUpdating,
      label,
      onLabel,
      onSectorClick,
      activeIndex
    } = this.props;
    let rendered = null;
    if (dataIsUpdating) {
      rendered = <Preloader />;
    } else if (data == null) {
      rendered = <NoDataMessage />;
    } else if (chart.labelColumn != null && chart.valueColumn != null) {
      const width = 600;
      const height = 400;
      rendered = (
        <recharts.PieChart
          width={width}
          height={height}
          margin={{ top: 100, left: 0, right: 0, bottom: 0 }}
        >
          <g>
            <ChartTitle
              width={width}
              left="300"
              value={label}
              onChange={onLabel}
            />
          </g>
          <recharts.Pie
            isAnimationActive={false}
            data={data}
            nameKey={chart.labelColumn}
            valueKey={chart.valueColumn}
            outerRadius={130}
            activeIndex={activeIndex}
            activeShape={this.activeShape}
            label={this.label}
          >
            {data.map((entry, index) => {
              const id = entry[chart.labelColumn];
              return (
                <recharts.Cell
                  key={id}
                  fill={getPieColor(chart, id)}
                  onClick={
                    onSectorClick ? onSectorClick.bind(null, index) : undefined
                  }
                />
              );
            })}
          </recharts.Pie>
        </recharts.PieChart>
      );
    }
    return (
      <VBox flexGrow={1} alignItems="center">
        {rendered}
      </VBox>
    );
  }
}
