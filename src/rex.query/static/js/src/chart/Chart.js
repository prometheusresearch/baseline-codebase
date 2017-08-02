/**
 * @flow
 */

import type {ChartSpec} from '../state';
import * as types from '../charting/types';
import type {QueryPipeline} from '../model/types';

import * as React from 'react';
import {VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import {findDOMNodeStrict as findDOMNode} from '../findDOMNode';
import {getPipelineContext} from '../model';
import * as ui from '../ui';
import * as State from '../state';
import * as model from './model';
import * as SVG from '../SVG';
import * as Fetch from '../fetch';
import * as Charting from '../charting';

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
    const {chartSpec, query: pipeline, data: rawData} = this.props;
    const {label: originalLabel, chart} = chartSpec;
    const label = originalLabel || model.getChartTitle(chart, pipeline);

    let children;

    const {query, data} = model.getQuery(pipeline, rawData);
    if (query == null) {
      children = null;
    } else {
      const context = getPipelineContext(query);
      const optionsForLabel = model.getSelectOptionsFromContext(context);
      const optionsForMeasure = model.getSelectOptionsFromContext(context, {
        onlyNumerics: true,
        addSumarizations: true,
      });
      switch (chart.type) {
        case 'pie': {
          children = (
            <Charting.PieChartEditor
              data={data}
              label={label}
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
              data={data}
              label={label}
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
              data={data}
              label={label}
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
              data={data}
              label={label}
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
              data={data}
              label={label}
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
        <VBox flexGrow={1} ref={chart => (this._chart = chart)}>
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

  onUpdateChart = (chart: types.Chart) => {
    this.context.actions.updateChart({chartId: this.props.chartSpec.id, chart});
  };
}
