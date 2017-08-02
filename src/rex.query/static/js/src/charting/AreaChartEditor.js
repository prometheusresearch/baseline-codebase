/**
 * @flow
 */

import * as types from './types';

import * as React from 'react';
import {VBox} from 'react-stylesheet';

import * as ui from '../ui';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import NoNumericAttributeText from './NoNumericAttributeText';
import AreaChart from './AreaChart';

type AreaChartEditorProps = types.ChartEditorBaseProps<types.AreaChart> & {
  optionsForX: Array<ui.SelectOption>,
  optionsForArea: Array<ui.SelectOption>,
};

export default function AreaChartEditor({
  label,
  onLabel,
  chart,
  onChart,
  data,
  optionsForX,
  optionsForArea,
  dataIsUpdating,
}: AreaChartEditorProps) {
  const areaList = chart.areaList.concat({
    valueColumn: null,
    color: '#8884d8',
  });
  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          options={optionsForX}
          label="X axis"
          value={chart.labelColumn}
          onChange={(labelColumn, option) =>
            onChart({
              type: 'area',
              ...chart,
              labelColumn,
              label: option ? option.label : null,
            })}
        />
        {areaList.map((area, index) => {
          const updateChart = (values: types.Line) => {
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
              label="Area"
              noValueLabel="Add new area"
              noResultsText={<NoNumericAttributeText />}
              options={optionsForArea}
              value={area.valueColumn}
              onChange={(valueColumn, option) =>
                updateChart({...area, valueColumn, label: option ? option.label : null})}
              color={area.color}
              onColorChange={color => updateChart({...area, color})}
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
