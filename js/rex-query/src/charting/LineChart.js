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

type LineChartProps = types.ChartBaseProps<types.LineChart>;

export default function LineChart({
  label,
  onLabel,
  chart,
  data,
  dataIsUpdating
}: LineChartProps) {
  let rendered = null;
  if (dataIsUpdating) {
    rendered = <Preloader />;
  } else if (data == null) {
    rendered = <NoDataMessage />;
  } else if (chart.labelColumn != null && chart.lineList.length > 0) {
    const width = 600;
    rendered = (
      <recharts.LineChart
        key={getLineChartKey(chart)}
        data={data}
        width={width}
        height={400}
        style={{ fontWeight: 200, fontSize: "9pt" }}
        margin={{ top: 100, right: 30, left: 20, bottom: 5 }}
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
        <recharts.Tooltip label={chart.label} />
        <recharts.Legend />
        {chart.lineList.map(line => {
          return (
            <recharts.Line
              key={line.valueColumn}
              name={line.label}
              dataKey={line.valueColumn}
              type="monotone"
              stroke={line.color}
            />
          );
        })}
      </recharts.LineChart>
    );
  }
  return (
    <VBox flexGrow={1} alignItems="center">
      {rendered}
    </VBox>
  );
}

function getLineChartKey(chart: types.LineChart): string {
  return chart.lineList
    .map(bar => `${String(bar.valueColumn)}--${bar.color}`)
    .join(":");
}
