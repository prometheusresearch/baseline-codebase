/**
 * @flow
 */

import type {ChartSpec} from '../state';
import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import {findDOMNodeStrict as findDOMNode} from '../findDOMNode';
import * as ui from '../ui';
import * as State from '../state';
import * as model from './model';
import * as SVG from '../SVG';
import * as Fetch from '../fetch';
import AreaChart from './AreaChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import BarChart from './BarChart';
import ScatterChart from './ScatterChart';

type ChartProps = {
  chartSpec: ChartSpec,
  query: QueryPipeline,
  data: any,
};

const EXPORT_FONT = '11px -apple-system, "Helvetica Neue", "Lucida Grande"';

function findChartElement(element: HTMLElement): ?HTMLElement {
  return element.querySelector('svg.recharts-surface');
}

export default class Chart extends React.Component {
  static contextTypes = {
    actions: React.PropTypes.object,
  };

  context: {actions: State.Actions};
  props: ChartProps;

  _chart: ?Object;

  render() {
    const {chartSpec, query, ...props} = this.props;
    const {label: originalLabel, chart} = chartSpec;
    const label = originalLabel || model.getChartTitle(chart, query);
    let children;
    switch (chart.type) {
      case 'pie': {
        children = (
          <PieChart
            {...props}
            label={label}
            onLabel={this.onUpdateLabel}
            query={query}
            chart={chart}
            onChart={this.onUpdateChart}
          />
        );
        break;
      }
      case 'line': {
        children = (
          <LineChart
            {...props}
            label={label}
            onLabel={this.onUpdateLabel}
            query={query}
            chart={chart}
            onChart={this.onUpdateChart}
          />
        );
        break;
      }
      case 'area': {
        children = (
          <AreaChart
            {...props}
            label={label}
            onLabel={this.onUpdateLabel}
            query={query}
            chart={chart}
            onChart={this.onUpdateChart}
          />
        );
        break;
      }
      case 'bar': {
        children = (
          <BarChart
            {...props}
            label={label}
            onLabel={this.onUpdateLabel}
            query={query}
            chart={chart}
            onChart={this.onUpdateChart}
          />
        );
        break;
      }
      case 'scatter': {
        children = (
          <ScatterChart
            {...props}
            label={label}
            onLabel={this.onUpdateLabel}
            query={query}
            chart={chart}
            onChart={this.onUpdateChart}
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
            icon={<ui.Icon.IconDownload />}
            onClick={this.onExportChart}>
            Export as image
          </ReactUI.QuietButton>
          <ReactUI.QuietButton
            onClick={this.onRemoveChart}
            icon={<ui.Icon.IconRemove />}
          />
        </HBox>
        <VBox flexGrow={1} ref={chart => this._chart = chart}>
          {children}
        </VBox>
      </VBox>
    );
  }

  onExportChart = () => {
    if (this._chart != null) {
      const element = findDOMNode(this._chart);
      const svgElement = findChartElement(element);
      if (svgElement != null) {
        SVG.rasterizeElement(svgElement, {font: EXPORT_FONT}).then(data => {
          if (data != null) {
            Fetch.initiateDownloadFromBlob(data, 'chart.png', 'image/png');
          }
        });
      }
    }
  };

  onRemoveChart = () => {
    this.context.actions.removeChart({chartId: this.props.chartSpec.id});
  };

  onUpdateLabel = (label: string) => {
    this.context.actions.updateChart({chartId: this.props.chartSpec.id, label});
  };

  onUpdateChart = (chart: model.Chart) => {
    this.context.actions.updateChart({chartId: this.props.chartSpec.id, chart});
  };
}
