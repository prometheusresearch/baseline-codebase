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

type AreaChartProps = types.ChartBaseProps<types.AreaChart>;

export default function AreaChart({
  label,
  onLabel,
  chart,
  data,
  dataIsUpdating
}: AreaChartProps) {
  let rendered = null;
  if (dataIsUpdating) {
    rendered = <Preloader />;
  } else if (data == null) {
    rendered = <NoDataMessage />;
  } else if (chart.labelColumn != null && chart.areaList.length > 0) {
    const width = 600;
    rendered = (
      <recharts.AreaChart
        key={getAreaChartKey(chart)}
        data={data}
        width={width}
        height={400}
        margin={{ top: 100, right: 30, left: 20, bottom: 5 }}
        style={{ fontWeight: 200, fontSize: "9pt" }}
      >
        <g>
          <ChartTitle
            width={width}
            left={300}
            value={label}
            onChange={onLabel}
          />
        </g>
        <recharts.XAxis
          dataKey={String(chart.labelColumn)}
          name={chart.label}
        />
        <recharts.YAxis />
        <recharts.CartesianGrid strokeDasharray="3 3" />
        <recharts.Tooltip />
        <recharts.Legend />
        {chart.areaList.map(area => (
          <recharts.Area
            key={area.valueColumn}
            name={area.label}
            dataKey={area.valueColumn}
            stroke={area.color}
            fill={area.color}
            fillOpacity={0.6}
          />
        ))}
      </recharts.AreaChart>
    );
  }
  return (
    <VBox flexGrow={1} alignItems="center">
      {rendered}
    </VBox>
  );
}

function getAreaChartKey(chart: types.AreaChart): string {
  return chart.areaList
    .map(item => `${String(item.valueColumn)}--${item.color}`)
    .join(":");
}
