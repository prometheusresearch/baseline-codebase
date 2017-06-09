/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {autobind} from 'rex-widget/lang';
import {WithDOMSize, Preloader as BasePreloader} from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import {VBox} from 'rex-widget/layout';
import Action from '../Action';
import * as ContextUtils from '../ContextUtils';

function loadPlotly() {
  return new Promise(resolve =>
    require.ensure(['../vendor/plotly'], require =>
      resolve(require('../vendor/plotly'))));
}

function fetchPlotData({data, context, contextTypes}) {
  data = data.params(
    ContextUtils.contextToParams(context, contextTypes.input, {query: true}),
  );
  return {data};
}

function Preloader() {
  return (
    <VBox flex={1} justifyContent="center" alignItems="center">
      <BasePreloader />
    </VBox>
  );
}

function buildTraceSpec(trace, plot, key) {
  if (trace.length === 0) {
    return null;
  }

  let traceSpec = {};

  if (plot.type !== undefined) {
    traceSpec = {...traceSpec, ...plot};
  } else {
    traceSpec = {...traceSpec, ...plot[key]};
  }

  if (trace[0].x !== undefined) {
    traceSpec = {
      ...traceSpec,
      x: trace.map(item => item.x),
    };
  }
  if (trace[0].y !== undefined) {
    traceSpec = {
      ...traceSpec,
      y: trace.map(item => item.y),
    };
  }
  if (trace[0].label !== undefined) {
    traceSpec = {
      ...traceSpec,
      labels: trace.map(item => item.label),
    };
  }
  if (trace[0].value !== undefined) {
    traceSpec = {
      ...traceSpec,
      values: trace.map(item => item.value),
    };
  }

  return traceSpec;
}

@WithDOMSize({forceAsync: true})
@Fetch(fetchPlotData)
export default class Plot extends React.Component {
  static defaultProps = {icon: 'plot'};

  constructor(props) {
    super(props);
    this.state = {plotly: null};
    this._plotElement = null;
  }

  render() {
    let {fetched: {data}, ...props} = this.props;
    return (
      <Action {...props} flex={1}>
        {data.updating || this.state.plotly === null
          ? <Preloader />
          : <VBox flexGrow={1} padding={5} ref={this._onPlotElement} />}
      </Action>
    );
  }

  componentDidUpdate() {
    this.plot();
  }

  componentDidMount() {
    loadPlotly().then(plotly => {
      this.setState({plotly});
      this.forceUpdate();
    });
  }

  @autobind _onPlotElement(plotElement) {
    this._plotElement = plotElement;
  }

  plot() {
    let {fetched: {data}, plot, layout, DOMSize} = this.props;
    if (!this._plotElement || !DOMSize || data.updating) {
      return;
    }
    let dataSpec = Object.keys(data.data)
      .map(key => buildTraceSpec(data.data[key], plot, key))
      .filter(Boolean);
    let layoutSpec = {
      ...layout,
      width: DOMSize.width - 50,
      height: DOMSize.height - 80,
    };
    let options = {
      modeBarButtonsToRemove: [
        'sendDataToCloud',
        'hoverClosestCartesian',
        'hoverCompareCartesian',
      ],
      displaylogo: false,
    };
    let node = ReactDOM.findDOMNode(this._plotElement);
    this.state.plotly.newPlot(node, dataSpec, layoutSpec, options);
    this.state.plotly.Plots.resize(node);
  }
}
