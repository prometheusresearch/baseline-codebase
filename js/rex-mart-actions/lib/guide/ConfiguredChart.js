/**
 * @copyright 2017-present Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';

import * as ReactUI from '@prometheusresearch/react-ui';
import * as React from 'react';
import {VBox, HBox} from 'react-stylesheet';

// $FlowFixMe: update rex.widget typings
import {withFetch, request, type DataSet, type Request} from 'rex-widget/data';
import * as Charting from 'rex-query/charting';
import * as RexQueryUI from 'rex-query/src/ui';
import * as ChartUtil from './ChartUtil.js';

function fetchData({data, filterState = []}) {
  return {
    data: data.data(JSON.stringify({filters: filterState})),
  };
}

function unwrapData(data) {
  return data == null ? null : data[Object.keys(data)[0]];
}

type Props = {
  data: Request,
  chart: Types.Chart,
  Chart: React.ComponentType<*>,
  config: any,
  fetched: {
    data: DataSet<>,
  },
};

class ChartBase extends React.Component<Props> {
  chart: ?React.Component<*>;

  onExport = () => {
    if (this.chart != null) {
      ChartUtil.exportChart(this.chart);
    }
  };

  onChart = chart => {
    this.chart = chart;
  };

  render() {
    const {Chart, chart, config, fetched: {data}} = this.props;
    return (
      <VBox padding={20} ref={this.onChart}>
        <HBox padding={5}>
          <ReactUI.QuietButton
            size="small"
            onClick={this.onExport}
            icon={<RexQueryUI.Icon.IconDownload />}>
            Export
          </ReactUI.QuietButton>
        </HBox>
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
