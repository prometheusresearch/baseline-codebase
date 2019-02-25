/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';
import * as ChartingTypes from 'rex-query/src/charting/types';

import * as React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

// $FlowFixMe: update rex.widget typings
import {withFetch, request, type DataSet} from 'rex-widget/data';
import * as Charting from 'rex-query/charting';
import * as ChartUtil from './ChartUtil.js';
import * as RexQueryUI from 'rex-query/src/ui';

import {prepareFetchParams} from './fetchResults';

const NUMERIC_DOMAINS = ['integer', 'float', 'decimal', 'date', 'time', 'datetime'];

type ChartProps = {
  /**
   * Chart specification.
   */
  chartSpec: Types.ChartSpec,

  /**
   * Columns specification available.
   */
  columns: Array<Types.ColumnSpec>,

  /**
   * An URL pointing to result API.
   */
  resultsUrl: string,

  sortState: Types.SortState,

  filterState: Types.FilterState,

  /**
   * Called when chart should be removed.
   */
  onRemoveChart: Types.ChartSpec => *,

  /**
   * Called when chart is being updated.
   */
  onUpdateChart: (Types.ChartSpec, Types.Chart) => *,

  /**
   * Called when chart's label is being updated.
   */
  onUpdateLabel: (Types.ChartSpec, string) => *,

  /** Dataset */
  fetched: {data: DataSet<Types.HTSQLProduct>},
};

export class Chart extends React.Component<ChartProps> {
  render() {
    const {chartSpec: {label, chart}, columns, fetched: {data}} = this.props;

    let children;

    const dataIsLoading = data.updating || data.data == null;
    const dataToChart = data.data != null ? data.data.data : null;

    // TODO: now we allow all options in optionsForMeasure which is not correct
    // (not always produces the plot) as we don't have needed metadata for that.
    const optionsForLabel = columns.map((col, idx) => {
      // $FlowFixMe: ...
      return {label: col.title, value: String(idx)};
    });

    const optionsForMeasure = columns
      .map((col, idx) => {
        if (NUMERIC_DOMAINS.indexOf(col.type) === -1) {
          return (null: any);
        } else {
          return {label: col.title, value: String(idx)};
        }
      })
      .filter(col => col != null);

    switch (chart.type) {
      case 'pie': {
        children = (
          <Charting.PieChartEditor
            dataIsLoading={dataIsLoading}
            dataIsUpdating={dataIsLoading}
            data={dataToChart}
            label={label || 'Pie Chart'}
            onLabel={this.onUpdateLabel}
            chart={chart}
            onChart={this.onUpdateChart}
            optionsForLabel={optionsForLabel}
            optionsForValue={optionsForMeasure}
          />
        );
        break;
      }
      case 'line': {
        children = (
          <Charting.LineChartEditor
            dataIsLoading={dataIsLoading}
            dataIsUpdating={dataIsLoading}
            data={dataToChart}
            label={label || 'Line Chart'}
            onLabel={this.onUpdateLabel}
            chart={chart}
            onChart={this.onUpdateChart}
            optionsForX={optionsForLabel}
            optionsForLine={optionsForMeasure}
          />
        );
        break;
      }
      case 'area': {
        children = (
          <Charting.AreaChartEditor
            dataIsLoading={dataIsLoading}
            dataIsUpdating={dataIsLoading}
            data={dataToChart}
            label={label || 'Area Chart'}
            onLabel={this.onUpdateLabel}
            chart={chart}
            onChart={this.onUpdateChart}
            optionsForX={optionsForLabel}
            optionsForArea={optionsForMeasure}
          />
        );
        break;
      }
      case 'bar': {
        children = (
          <Charting.BarChartEditor
            dataIsLoading={dataIsLoading}
            dataIsUpdating={dataIsLoading}
            data={dataToChart}
            label={label || 'Bar Chart'}
            onLabel={this.onUpdateLabel}
            chart={chart}
            onChart={this.onUpdateChart}
            optionsForX={optionsForLabel}
            optionsForBar={optionsForMeasure}
          />
        );
        break;
      }
      case 'scatter': {
        children = (
          <Charting.ScatterChartEditor
            dataIsLoading={dataIsLoading}
            dataIsUpdating={dataIsLoading}
            data={dataToChart}
            label={label || 'Scatter Chart'}
            onLabel={this.onUpdateLabel}
            chart={chart}
            onChart={this.onUpdateChart}
            optionsForX={optionsForLabel}
            optionsForY={optionsForLabel}
          />
        );
        break;
      }
      default:
        children = null;
    }

    return (
      <VBox height={0} overflow="auto" flexGrow={1}>
        <HBox padding={10} justifyContent="space-between">
          <ReactUI.QuietButton
            size="small"
            icon={<RexQueryUI.Icon.IconDownload />}
            onClick={this.onExportChart}>
            Export
          </ReactUI.QuietButton>
          <ReactUI.QuietButton
            onClick={this.onRemoveChart}
            icon={<RexQueryUI.Icon.IconRemove />}
          />
        </HBox>
        <VBox flexGrow={1} ref={this.onChart}>
          {children}
        </VBox>
      </VBox>
    );
  }

  chart: ?React.Component<*>;

  onChart = (chart: *) => {
    this.chart = chart;
  };

  onExportChart = () => {
    if (this.chart != null) {
      ChartUtil.exportChart(this.chart);
    }
  };

  onRemoveChart = () => {
    this.props.onRemoveChart(this.props.chartSpec);
  };

  onUpdateLabel = (label: string) => {
    this.props.onUpdateLabel(this.props.chartSpec, label);
  };

  onUpdateChart = (chart: Types.Chart) => {
    this.props.onUpdateChart(this.props.chartSpec, chart);
  };
}

export function fetchResultsSpec(props: ChartProps) {
  const body = prepareFetchParams({
    ...props,
    // For now we force all columns to be loaded. This is suboptimal as we fetch
    // more data than needed but easier to manage now because of how column state
    // is managed (now stable column identifiers exposed).
    columnState: props.columns.map((_, idx) => true),
    // We don't limit datasets for charting
    limit: undefined,
    offset: undefined,
  });
  const data = request(props.resultsUrl).headers({Accept: 'x-htsql/raw'}).data(body);
  return {data};
}
export default withFetch(Chart, fetchResultsSpec);
