/**
 * @flow
 */

import * as types from './types';

import * as React from 'react';
import {VBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as ui from '../ui';
import SelectAttribute from './SelectAttribute';
import SelectAttributeWithColor from './SelectAttributeWithColor';
import ChartControlPanel from './ChartControlPanel';
import ChartControl from './ChartControl';
import NoNumericAttributeText from './NoNumericAttributeText';
import BarChart from './BarChart';

type BarChartEditorProps = types.ChartEditorBaseProps<types.BarChart> & {
  optionsForX: Array<ui.SelectOption>,
  optionsForBar: Array<ui.SelectOption>,
};

export default function BarChartEditor({
  label,
  onLabel,
  chart,
  onChart,
  data,
  optionsForX,
  optionsForBar,
  dataIsUpdating,
}: BarChartEditorProps) {
  const barList = chart.barList.concat({
    valueColumn: null,
    color: '#8884d8',
  });
  return (
    <VBox overflow="visible" flexGrow={1}>
      <ChartControlPanel>
        <SelectAttribute
          label="Label"
          value={chart.labelColumn}
          options={optionsForX}
          onChange={(labelColumn, option) =>
            onChart({
              type: 'bar',
              ...chart,
              labelColumn,
              label: option ? option.label : null,
            })}
        />
        {barList.map((bar, index) => {
          const updateBar = values => {
            const barList = chart.barList.slice(0);
            if (values.valueColumn === null) {
              barList.splice(index, 1);
            } else {
              barList.splice(index, 1, {
                ...barList[index],
                ...values,
              });
            }
            onChart({type: 'bar', ...chart, barList});
          };
          return (
            <SelectAttributeWithColor
              key={index}
              label="Bar"
              noValueLabel="Add new bar"
              noResultsText={<NoNumericAttributeText />}
              options={optionsForBar}
              value={bar.valueColumn}
              onChange={(valueColumn, option) =>
                updateBar({...bar, valueColumn, label: option ? option.label : null})}
              color={bar.color}
              onColorChange={color => updateBar({...bar, color})}
            />
          );
        })}
        {chart.barList.length > 1 &&
          <ChartControl
            label="Stack vertically"
            control={
              <ReactUI.Checkbox
                value={chart.stacked === 'vertical'}
                onChange={vertical =>
                  onChart({
                    type: 'bar',
                    ...chart,
                    stacked: vertical ? 'vertical' : 'horizontal',
                  })}
              />
            }
          />}
      </ChartControlPanel>
      <VBox flexGrow={1} alignItems="center">
        <BarChart
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
