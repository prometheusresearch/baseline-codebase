/**
 * @flow
 */

import React from 'react';
import {Element} from 'react-stylesheet';

import * as ui from '../ui';
import * as Chart from '../chart';
import PieChartIcon from './icon/PieChartIcon';
import BarChartIcon from './icon/BarChartIcon';
import ScatterChartIcon from './icon/ScatterChartIcon';
import LineChartIcon from './icon/LineChartIcon';

type AddChartDialogueProps = {
  onAddChart: ({chartType: Chart.ChartType}) => void,
};

export default function AddChartDialogue({onAddChart}: AddChartDialogueProps) {
  return (
    <div>
      <ui.Header>Select chart type</ui.Header>
      <Element margin={20}>
        <AddChartItem
          label="Pie chart"
          chartType="pie"
          onClick={onAddChart}
          icon={<PieChartIcon />}
        />
        <AddChartItem
          label="Line chart"
          chartType="line"
          onClick={onAddChart}
          icon={<LineChartIcon />}
        />
        <AddChartItem
          label="Bar chart"
          chartType="bar"
          onClick={onAddChart}
          icon={<BarChartIcon />}
        />
        <AddChartItem
          label="Scatter plot"
          chartType="scatter"
          onClick={onAddChart}
          icon={<ScatterChartIcon />}
        />
      </Element>
      <Element
        Component="a"
        href="http://www.flaticon.com/authors/freepik"
        padding={15}
        bottom={0}
        right={0}
        position="absolute"
        display="inline-block"
        color="#bbb"
        colorOnHover="#444"
        style={{textDecoration: 'none'}}
        fontWeight={200}
        fontSize="8pt">
        Icons designed by Freepik at Flaticons
      </Element>
    </div>
  );
}

function AddChartItem({label, icon, chartType, onClick}) {
  return (
    <Element
      display="inline-block"
      padding={{horizontal: 15, vertical: 10}}
      background="#fff"
      backgroundOnHover="#fafafa"
      marginBottom={10}
      marginRight={10}
      fontSize="9pt"
      fontWeight={200}
      width={90}
      textAlign="center"
      userSelect="none"
      cursor="default"
      border="1px solid #ccc"
      borderRadius={2}
      borderOnHover="1px solid #aaa"
      onClick={() => onClick({chartType})}>
      <Element padding={5}>
        {icon}
      </Element>
      {label}
    </Element>
  );
}
