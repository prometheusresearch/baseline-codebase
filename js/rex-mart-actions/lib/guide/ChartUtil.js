/**
 * @flow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as SVG from 'rex-query/src/SVG';
import * as Fetch from 'rex-query/src/fetch';

function findChartElement(element: HTMLElement): ?HTMLElement {
  return element.querySelector('svg.recharts-surface');
}

type RasterizeElementConfig = {
  font?: string,
};

function rasterizeElement(
  element: HTMLElement,
  config?: RasterizeElementConfig = {},
): Promise<?string> {
  const {width, height} = element.getBoundingClientRect();
  const data = new XMLSerializer().serializeToString(element);
  return rasterizeSvg(data, {...config, width, height});
}

async function rasterizeSvg(svg: string, config: RasterizeConfig): Promise<?string> {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;

  const canvasCtx = canvas.getContext('2d');

  if (canvasCtx == null) {
    return Promise.resolve(null);
  }
  await SVG.renderToCanvas(svg, canvasCtx, config);
  return canvas.toDataURL('image/png');
}

export function exportChart(chart: ?React.Component<*>) {
  const element = ReactDOM.findDOMNode(chart);
  if (element == null || !(element instanceof HTMLElement)) {
    return;
  }
  const svgElement = findChartElement(element);
  if (svgElement == null) {
    return;
  }
  rasterizeElement(svgElement, {font: EXPORT_FONT}).then(data => {
    if (data != null) {
      Fetch.initiateDownloadFromBlob(data, 'chart.png', 'image/png');
    }
  });
}

const EXPORT_FONT = '11px -apple-system, "Helvetica Neue", "Lucida Grande"';
