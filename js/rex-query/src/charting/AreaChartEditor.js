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
import AreaChart from "./AreaChart";

type AreaChartEditorProps = types.ChartEditorBaseProps<types.AreaChart> & {
  optionsForX: $ReadOnlyArray<ui.SelectOption>,
  optionsForArea: $ReadOnlyArray<ui.SelectOption>
};

export default function AreaChartEditor({
  label,
  onLabel,
  chart,
  onChart,
  data,
  optionsForX,
  optionsForArea,
  dataIsUpdating
}: AreaChartEditorProps) {
  const areaList = chart.areaList.concat({
    valueColumn: null,
    color: "#8884d8"
  });
  const onLabelChange = (labelColumn, option) => {
    const label =
      option && typeof option.label === "string" ? option.label : null;
    onChart({
      type: "area",
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
          onChange={onLabelChange}
        />
        {areaList.map((area, index) => {
          const updateChart = (values: types.Line) => {
            const areaList = chart.areaList.slice(0);
            if (values.valueColumn === null) {
              areaList.splice(index, 1);
            } else {
              areaList.splice(index, 1, {
                ...areaList[index],
                ...values
              });
            }
            onChart({ type: "area", ...chart, areaList });
          };
          const onAreaChange = (valueColumn, option) => {
            const label =
              option && typeof option.label === "string" ? option.label : null;
            updateChart({ ...area, valueColumn, label });
          };
          return (
            <SelectAttributeWithColor
              key={index}
              label="Area"
              noValueLabel="Add new area"
              noResultsText={<NoNumericAttributeText />}
              options={optionsForArea}
              value={area.valueColumn}
              onChange={onAreaChange}
              color={area.color}
              onColorChange={color => updateChart({ ...area, color })}
            />
          );
        })}
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        <AreaChart
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
