/**
 * @flow
 */

import * as types from './types';

import * as React from 'react';
import * as recharts from 'recharts';
import {VBox} from 'react-stylesheet';

import * as ui from '../ui';
import ChartTitle from './ChartTitle';
import Preloader from './Preloader';
import NoDataMessage from './NoDataMessage';
import SelectAttribute from './SelectAttribute';
import ScatterChart from './ScatterChart';

type ScatterChartEditorProps = types.ChartEditorBaseProps<types.ScatterChart> & {
  optionsForX: Array<ui.SelectOption>,
  optionsForY: Array<ui.SelectOption>,
};

export default function ScatterChartEditor({
  label,
  onLabel,
  chart,
  onChart,
  data,
  optionsForX,
  optionsForY,
  dataIsUpdating,
}: ScatterChartEditorProps) {
  return (
    <VBox overflow="visible" flexGrow={1}>
      <VBox overflow="visible" marginBottom={10}>
        <SelectAttribute
          options={optionsForX}
          label="X axis"
          value={chart.xColumn}
          onChange={(xColumn, option) =>
            onChart({
              type: 'scatter',
              ...chart,
              xColumn,
              xLabel: option ? option.label : null,
            })}
        />
        <SelectAttribute
          options={optionsForY}
          label="Y axis"
          value={chart.yColumn}
          onChange={(yColumn, option) =>
            onChart({
              type: 'scatter',
              ...chart,
              yColumn,
              yLabel: option ? option.label : null,
            })}
        />
      </VBox>
      <VBox flexGrow={1}>
        <ScatterChart
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
