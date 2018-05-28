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

export function exportChart(chart: ?React.Component<*>) {
  const element = ReactDOM.findDOMNode(chart);
  if (element == null || !(element instanceof HTMLElement)) {
    return;
  }
  const svgElement = findChartElement(element);
  if (svgElement == null) {
    return;
  }
  SVG.rasterizeElement(svgElement, {font: EXPORT_FONT}).then(data => {
    if (data != null) {
      Fetch.initiateDownloadFromBlob(data, 'chart.png', 'image/png');
    }
  });
}

const EXPORT_FONT = '11px -apple-system, "Helvetica Neue", "Lucida Grande"';
