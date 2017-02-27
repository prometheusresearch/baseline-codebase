/**
 * @flow
 */

import React from 'react';
import {Element} from 'react-stylesheet';

import * as ui from '../ui';
import * as Chart from '../chart';

type AddChartDialogueProps ={
  onAddChart: {chartType: Chart.ChartType} => void,
};

export default function AddChartDialogue({onAddChart}: AddChartDialogueProps) {
  return (
    <div>
      <ui.Header>Add chart</ui.Header>
      <Element margin={20}>
        <AddChartItem
          label="Pie chart"
          chartType="pie"
          onClick={onAddChart}
          />
        <AddChartItem
          label="Line chart"
          chartType="line"
          onClick={onAddChart}
          />
        <AddChartItem
          label="Bar chart"
          chartType="bar"
          onClick={onAddChart}
          />
        <AddChartItem
          label="Scatter plot"
          chartType="scatter"
          onClick={onAddChart}
          />
      </Element>
    </div>
  );
}

function AddChartItem({label, chartType, onClick}) {
  return (
    <Element
      display="inline-block"
      padding={{horizontal: 15, vertical: 10}}
      background="#fff"
      backgroundOnHover="#fafafa"
      marginBottom={10}
      marginRight={10}
      fontSize="10pt"
      fontWeight={200}
      cursor="default"
      border="1px solid #ccc"
      borderOnHover="1px solid #aaa"
      onClick={() => onClick({chartType})}>
      {label}
    </Element>
  );
}
