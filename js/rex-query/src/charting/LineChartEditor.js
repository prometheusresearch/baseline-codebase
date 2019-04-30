/**
 * @flow
 */

import * as types from "./types";

import * as React from "react";
import { VBox } from "react-stylesheet";

import * as ui from "../ui";
import SelectAttribute from "./SelectAttribute";
import SelectAttributeWithColor from "./SelectAttributeWithColor";
import ChartControlPanel from "./ChartControlPanel";
import NoNumericAttributeText from "./NoNumericAttributeText";
import LineChart from "./LineChart";

type LineChartEditorProps = types.ChartEditorBaseProps<types.LineChart> & {
  optionsForX: $ReadOnlyArray<ui.SelectOptionWithStringLabel>,
  optionsForLine: $ReadOnlyArray<ui.SelectOptionWithStringLabel>
};

export default function LineChartEditor({
  label,
  onLabel,
  chart,
  onChart,
  data,
  optionsForX,
  optionsForLine,
  dataIsUpdating
}: LineChartEditorProps) {
  const lineList = chart.lineList.concat({
    valueColumn: null,
    color: "#8884d8"
  });

  const onXChange = (labelColumn, option) => {
    const label =
      option && typeof option.label === "string" ? option.label : null;
    onChart({
      type: "line",
      ...chart,
      labelColumn,
      label
    });
  };

  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          options={optionsForX}
          label="X axis"
          value={chart.labelColumn}
          onChange={onXChange}
        />
        {lineList.map((line, index) => {
          const updateChart = (values: types.Line) => {
            const lineList = chart.lineList.slice(0);
            if (values.valueColumn === null) {
              lineList.splice(index, 1);
            } else {
              lineList.splice(index, 1, {
                ...lineList[index],
                ...values
              });
            }
            onChart({ type: "line", ...chart, lineList });
          };
          const onLineChange = (valueColumn, option) => {
            const label =
              option && typeof option.label === "string" ? option.label : null;
            updateChart({ ...line, valueColumn, label });
          };
          return (
            <SelectAttributeWithColor
              key={index}
              options={optionsForLine}
              label="Line"
              noValueLabel="Add new line"
              noResultsText={<NoNumericAttributeText />}
              value={line.valueColumn}
              onChange={onLineChange}
              color={line.color}
              onColorChange={color => updateChart({ ...line, color })}
            />
          );
        })}
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        <LineChart
          chart={chart}
          data={data}
          dataIsUpdating={dataIsUpdating}
          label={label}
          onLabel={onLabel}
        />
      </VBox>
    </VBox>
  );
}
