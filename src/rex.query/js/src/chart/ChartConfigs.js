/**
 * @flow
 */

import type {ChartSpec} from '../state';
import * as types from '../charting/types';
import type {QueryPipeline, ChartConfig} from '../model/types';

import * as React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import PieChartIcon from '../charting/icon/PieChartIcon';
import BarChartIcon from '../charting/icon/BarChartIcon';
import ScatterChartIcon from '../charting/icon/ScatterChartIcon';
import LineChartIcon from '../charting/icon/LineChartIcon';
import AreaChartIcon from '../charting/icon/AreaChartIcon';

import {findDOMNodeStrict as findDOMNode} from '../findDOMNode';
import {getPipelineContext} from '../model';
import * as ui from '../ui';
import * as State from '../state';
import * as model from './model';
import * as SVG from '../SVG';
import * as Fetch from '../fetch';
import * as Charting from '../charting';

const addIfNotNull = (set, column) => {
  if (column != null) {
    set.add(column);
  }
};

export type ChartProps<C> = {
  chartSpec: ChartSpec<C>,
  label: string,
  query: QueryPipeline,
  data: any,

  optionsForLabel: $ReadOnlyArray<ui.SelectOptionWithStringLabel>,
  optionsForMeasure: $ReadOnlyArray<ui.SelectOptionWithStringLabel>,

  onUpdateLabel: (label: string) => void,

  onUpdateChart: (chart: types.Chart) => void,
};

export class PieChart extends React.Component<ChartProps<types.PieChart>> {
  render() {
    const {
      label,
      chartSpec,
      query,
      data,
      optionsForLabel,
      optionsForMeasure,
    } = this.props;
    return (
      <Charting.PieChartEditor
        data={data}
        dataIsUpdating={false}
        label={label}
        onLabel={this.props.onUpdateLabel}
        chart={chartSpec.chart}
        onChart={this.props.onUpdateChart}
        optionsForLabel={optionsForLabel}
        optionsForValue={optionsForMeasure}
      />
    );
  }
}

export const pieChart: ChartConfig<'pie', types.PieChart> = {
  type: 'pie',
  label: 'Pie Chart',
  icon: <PieChartIcon />,

  chartEditor: PieChart,

  getInitialChart(query: QueryPipeline): types.PieChart {
    return {
      type: 'pie',
      labelColumn: model.getLabelColumn(query),
      valueColumn: null,
      color: {},
    };
  },

  getChartTitle(chart: types.PieChart, query: QueryPipeline): string {
    const desc = model.withRecordAttributesOrNull(query, attrs =>
      model.getChartDesc(
        attrs,
        chart.labelColumn,
        model.getValueLabel(attrs, [{valueColumn: chart.valueColumn}]),
      ),
    );
    return desc == null ? 'Pie Chart' : `${desc} — Pie Chart`;
  },

  getUsedAttributes(chart: types.PieChart): Set<string> {
    const attributes = new Set();
    addIfNotNull(attributes, chart.labelColumn);
    addIfNotNull(attributes, chart.valueColumn);
    return attributes;
  },
};

export class LineChart extends React.Component<ChartProps<types.LineChart>> {
  render() {
    const {
      label,
      chartSpec,
      query,
      data,
      optionsForLabel,
      optionsForMeasure,
    } = this.props;
    return (
      <Charting.LineChartEditor
        data={data}
        dataIsUpdating={false}
        label={label}
        onLabel={this.props.onUpdateLabel}
        chart={chartSpec.chart}
        onChart={this.props.onUpdateChart}
        optionsForX={optionsForLabel}
        optionsForLine={optionsForMeasure}
      />
    );
  }
}

export const lineChart: ChartConfig<'line', types.LineChart> = {
  type: 'line',
  label: 'Line Chart',
  icon: <LineChartIcon />,

  chartEditor: LineChart,

  getInitialChart(query: QueryPipeline): types.LineChart {
    return {type: 'line', labelColumn: model.getLabelColumn(query), lineList: []};
  },

  getChartTitle(chart: types.LineChart, query: QueryPipeline): string {
    const desc = model.withRecordAttributesOrNull(query, attrs =>
      model.getChartDesc(
        attrs,
        chart.labelColumn,
        model.getValueLabel(attrs, chart.lineList),
      ),
    );
    return desc == null ? 'Line Chart' : `${desc} — Line Chart`;
  },

  getUsedAttributes(chart: types.LineChart): Set<string> {
    const attributes = new Set();
    addIfNotNull(attributes, chart.labelColumn);
    for (const {valueColumn} of chart.lineList) {
      addIfNotNull(attributes, valueColumn);
    }
    return attributes;
  },
};

export class AreaChart extends React.Component<ChartProps<types.AreaChart>> {
  render() {
    const {
      label,
      chartSpec,
      query,
      data,
      optionsForLabel,
      optionsForMeasure,
    } = this.props;
    return (
      <Charting.AreaChartEditor
        data={data}
        dataIsUpdating={false}
        label={label}
        onLabel={this.props.onUpdateLabel}
        chart={chartSpec.chart}
        onChart={this.props.onUpdateChart}
        optionsForX={optionsForLabel}
        optionsForArea={optionsForMeasure}
      />
    );
  }
}

export const areaChart: ChartConfig<'area', types.AreaChart> = {
  type: 'area',
  label: 'Area Chart',
  icon: <AreaChartIcon />,

  chartEditor: AreaChart,

  getInitialChart(query: QueryPipeline): types.AreaChart {
    return {type: 'area', labelColumn: model.getLabelColumn(query), areaList: []};
  },

  getChartTitle(chart: types.AreaChart, query: QueryPipeline): string {
    const desc = model.withRecordAttributesOrNull(query, attrs =>
      model.getChartDesc(
        attrs,
        chart.labelColumn,
        model.getValueLabel(attrs, chart.areaList),
      ),
    );
    return desc == null ? 'Area Chart' : `${desc} — Area Chart`;
  },

  getUsedAttributes(chart: types.AreaChart): Set<string> {
    const attributes = new Set();
    addIfNotNull(attributes, chart.labelColumn);
    for (const {valueColumn} of chart.areaList) {
      addIfNotNull(attributes, valueColumn);
    }
    return attributes;
  },
};

export class BarChart extends React.Component<ChartProps<types.BarChart>> {
  render() {
    const {
      label,
      chartSpec,
      query,
      data,
      optionsForLabel,
      optionsForMeasure,
    } = this.props;
    return (
      <Charting.BarChartEditor
        data={data}
        dataIsUpdating={false}
        label={label}
        onLabel={this.props.onUpdateLabel}
        chart={chartSpec.chart}
        onChart={this.props.onUpdateChart}
        optionsForX={optionsForLabel}
        optionsForBar={optionsForMeasure}
      />
    );
  }
}

export const barChart: ChartConfig<'bar', types.BarChart> = {
  type: 'bar',
  label: 'Bar Chart',
  icon: <BarChartIcon />,

  chartEditor: BarChart,

  getInitialChart(query: QueryPipeline): types.BarChart {
    return {
      type: 'bar',
      labelColumn: model.getLabelColumn(query),
      stacked: 'horizontal',
      barList: [],
    };
  },

  getChartTitle(chart: types.BarChart, query: QueryPipeline): string {
    const desc = model.withRecordAttributesOrNull(query, attrs =>
      model.getChartDesc(
        attrs,
        chart.labelColumn,
        model.getValueLabel(attrs, chart.barList),
      ),
    );
    return desc == null ? 'Bar Chart' : `${desc} — Bar Chart`;
  },

  getUsedAttributes(chart: types.BarChart): Set<string> {
    const attributes = new Set();
    addIfNotNull(attributes, chart.labelColumn);
    for (const {valueColumn} of chart.barList) {
      addIfNotNull(attributes, valueColumn);
    }
    return attributes;
  },
};

export class ScatterChart extends React.Component<ChartProps<types.ScatterChart>> {
  render() {
    const {
      label,
      chartSpec,
      query,
      data,
      optionsForLabel,
      optionsForMeasure,
    } = this.props;
    return (
      <Charting.ScatterChartEditor
        data={data}
        dataIsUpdating={false}
        label={label}
        onLabel={this.props.onUpdateLabel}
        chart={chartSpec.chart}
        onChart={this.props.onUpdateChart}
        optionsForX={optionsForLabel}
        optionsForY={optionsForLabel}
      />
    );
  }
}

export const scatterChart: ChartConfig<'scatter', types.ScatterChart> = {
  type: 'scatter',
  label: 'Scatter Chart',
  icon: <ScatterChartIcon />,

  chartEditor: ScatterChart,

  getInitialChart(query: QueryPipeline): types.ScatterChart {
    return {type: 'scatter', xColumn: null, xLabel: null, yColumn: null, yLabel: null};
  },

  getChartTitle(chart: types.ScatterChart, query: QueryPipeline): string {
    const desc = model.withRecordAttributesOrNull(query, attrs => {
      if (
        chart.xColumn == null ||
        chart.yColumn == null ||
        !(chart.xColumn in attrs) ||
        !(chart.yColumn in attrs)
      ) {
        return null;
      }
      const yLabel = attrs[chart.yColumn].title;
      const xLabel = attrs[chart.xColumn].title;
      return `${yLabel}, ${xLabel}`;
    });
    return desc == null ? 'Scatter Chart' : `${desc} — Scatter Chart`;
  },

  getUsedAttributes(chart: types.ScatterChart): Set<string> {
    const attributes = new Set();
    addIfNotNull(attributes, chart.xColumn);
    addIfNotNull(attributes, chart.yColumn);
    return attributes;
  },
};
