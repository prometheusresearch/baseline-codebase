/**
 * @flow
 */

import type { ChartSpec } from "../state";
import * as types from "../charting/types";
import type { QueryPipeline, ChartConfig } from "../model/types";

import * as React from "react";
import PropTypes from "prop-types";
import { VBox, HBox } from "react-stylesheet";
// $FlowFixMe: ...
import * as ReactUI from "@prometheusresearch/react-ui";

import { findDOMNodeStrict as findDOMNode } from "../findDOMNode";
import { getPipelineContext } from "../model";
import * as ui from "../ui";
import * as State from "../state";
import * as model from "./model";
import * as SVG from "../SVG";
import * as Fetch from "../fetch";
import * as Charting from "../charting";

type ChartProps = {
  chartSpec: ChartSpec<>,

  chartConfig: ChartConfig<>,

  query: QueryPipeline,

  data: any
};

const EXPORT_FONT = '11px -apple-system, "Helvetica Neue", "Lucida Grande"';

function findChartElement(element: HTMLElement): ?HTMLElement {
  return element.querySelector("div.recharts-wrapper");
}

export default class Chart extends React.Component<ChartProps> {
  static contextTypes = {
    actions: PropTypes.object
  };

  context: { actions: State.Actions };
  props: ChartProps;

  _chart: ?Object;

  render() {
    let children;
    const {
      chartSpec,
      chartConfig,
      query: pipeline,
      data: rawData
    } = this.props;
    const { label: originalLabel, chart } = chartSpec;
    const label = originalLabel || chartConfig.getChartTitle(chart, pipeline);

    const { query, data } = model.getQuery(pipeline, rawData);
    if (query == null) {
      children = null;
    } else {
      const context = getPipelineContext(query);
      const optionsForLabel = model.getSelectOptionsFromContext(context);
      const optionsForMeasure = model.getSelectOptionsFromContext(context, {
        onlyNumerics: true,
        addSumarizations: true
      });

      if (chartConfig.chartEditor.type != null) {
        // $FlowFixMe: ...
        children = React.cloneElement(chartConfig.chartEditor, {
          query,
          chartSpec,
          label: label,
          data,
          dataIsUpdating: false,
          onUpdateLabel: this.onUpdateLabel,
          onUpdateChart: this.onUpdateChart,
          optionsForMeasure,
          optionsForLabel
        });
      } else {
        const ChartEditor = chartConfig.chartEditor;
        children = (
          // $FlowFixMe: ...
          <ChartEditor
            query={query}
            chartSpec={chartSpec}
            label={label}
            data={data}
            dataIsUpdating={false}
            onUpdateLabel={this.onUpdateLabel}
            onUpdateChart={this.onUpdateChart}
            optionsForLabel={optionsForLabel}
            optionsForMeasure={optionsForMeasure}
          />
        );
      }
    }
    return (
      <VBox height={0} overflow="auto" flexGrow={1}>
        <HBox padding={10} justifyContent="space-between">
          <ReactUI.QuietButton
            size="small"
            icon={<ui.Icon.IconDownload />}
            onClick={this.onExportChart}
          >
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
      const chartElement = findChartElement(element);

      if (chartElement != null) {
        const hideForExport = Array.from(
          chartElement.querySelectorAll(".hide-for-export")
        );

        // hide elements tagged with .hide-for-export
        const display = [];
        hideForExport.forEach((node, idx) => {
          display[idx] = node.style.display;
          node.style.display = "none";
        });

        rasterizeChart(chartElement).then(data => {
          // restore visibility of elements tagged with .hide-for-export
          hideForExport.forEach((node, idx) => {
            node.style.display = display[idx];
          });

          if (data != null) {
            Fetch.initiateDownloadFromBlob(data, "chart.png", "image/png");
          }
        });
      }
    }
  };

  onRemoveChart = () => {
    this.context.actions.removeChart({ chartId: this.props.chartSpec.id });
  };

  onUpdateLabel = (label: string) => {
    this.context.actions.updateChart({
      chartId: this.props.chartSpec.id,
      label
    });
  };

  onUpdateChart = (chart: types.Chart) => {
    this.context.actions.updateChart({
      chartId: this.props.chartSpec.id,
      chart
    });
  };
}

export async function rasterizeChart(element: HTMLElement): Promise<?string> {
  const serializer = new XMLSerializer();
  const data = serializer.serializeToString(element);
  const { width, height } = element.getBoundingClientRect();

  var svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${data}
      </foreignObject>
    </svg>
  `;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const canvasCtx = canvas.getContext("2d");
  await SVG.renderToCanvas(svgData, canvasCtx, { font: EXPORT_FONT });
  return canvas.toDataURL("image/png");
}
