/**
 * @copyright 2017-present Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';

import React from 'react';
import {VBox} from 'react-stylesheet';

import {withFetch, request, type DataSet, type Request} from 'rex-widget/data';
import * as Charting from 'rex-query/charting';

function fetchData({data, filterState = []}) {
  return {
    data: data.data(JSON.stringify({filters: filterState})),
  };
}

function unwrapData(data) {
  return data == null ? null : data[Object.keys(data)[0]];
}

class ChartBase extends React.Component {
  props: {
    data: Request,
    chart: Types.Chart,
    Chart: ReactClass<*>,
    config: any,
    fetched: {
      data: DataSet<>,
    },
  };

  render() {
    const {Chart, chart, config, fetched: {data}} = this.props;
    return (
      <VBox padding={20}>
        <Chart
          dataIsUpdating={data.updating}
          data={unwrapData(data.data)}
          label={config.title}
          chart={chart}
        />
      </VBox>
    );
  }
}

function PieChartBase(props) {
  const {config} = props;
  const chart: Types.PieChart = {
    type: 'pie',
    valueColumn: config.value.key,
    labelColumn: config.label.key,
    color: {},
  };
  return <ChartBase {...props} Chart={Charting.PieChart} chart={chart} />;
}

function LineChartBase(props) {
  const {config} = props;
  const chart: Types.LineChart = {
    type: 'line',
    labelColumn: config.label.key,
    lineList: config.lines.map(line => ({
      label: line.value.title,
      valueColumn: line.value.key,
      color: line.color,
    })),
  };
  return <ChartBase {...props} Chart={Charting.LineChart} chart={chart} />;
}

function AreaChartBase(props) {
  const {config} = props;
  const chart: Types.AreaChart = {
    type: 'area',
    labelColumn: config.label.key,
    areaList: config.areas.map(area => ({
      label: area.value.title,
      valueColumn: area.value.key,
      color: area.color,
    })),
  };
  return <ChartBase {...props} Chart={Charting.AreaChart} chart={chart} />;
}

function BarChartBase(props) {
  const {config} = props;
  const chart: Types.BarChart = {
    type: 'bar',
    labelColumn: config.label.key,
    stacked: config.stacked,
    barList: config.bars.map(bar => ({
      label: bar.value.title,
      valueColumn: bar.value.key,
      color: bar.color,
    })),
  };
  return <ChartBase {...props} Chart={Charting.BarChart} chart={chart} />;
}

function ScatterChartBase(props) {
  const {config} = props;
  const chart: Types.ScatterChart = {
    type: 'scatter',
    xColumn: config.x.key,
    xLabel: config.x.title,
    yColumn: config.y.key,
    yLabel: config.y.title,
  };
  return <ChartBase {...props} Chart={Charting.ScatterChart} chart={chart} />;
}

export const PieChart = withFetch(PieChartBase, fetchData);
export const LineChart = withFetch(LineChartBase, fetchData);
export const AreaChart = withFetch(AreaChartBase, fetchData);
export const BarChart = withFetch(BarChartBase, fetchData);
export const ScatterChart = withFetch(ScatterChartBase, fetchData);
