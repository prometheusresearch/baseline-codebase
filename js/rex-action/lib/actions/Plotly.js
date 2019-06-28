/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from "react";
import ReactDOM from "react-dom";
import { WithDOMSize } from "rex-ui/Layout";
import { withFetch } from "rex-widget/data";
import { VBox } from "react-stylesheet";
import * as rexui from "rex-ui";
import Action from "../Action";
import * as ContextUtils from "../ContextUtils";

function loadPlotly() {
  return import(/* webpackChunkName: "plotly.vendor" */ "../vendor-no-process/plotly");
}

function fetchPlotData({ data, context, contextTypes }) {
  data = data.params(
    ContextUtils.contextToParams(context, contextTypes.input, { query: true })
  );
  return { data };
}

function buildTraceSpec(trace, plot, key) {
  if (trace.length === 0) {
    return null;
  }

  let traceSpec = {};

  if (plot.type !== undefined) {
    traceSpec = { ...traceSpec, ...plot };
  } else {
    traceSpec = { ...traceSpec, ...plot[key] };
  }

  if (trace[0].x !== undefined) {
    traceSpec = {
      ...traceSpec,
      x: trace.map(item => item.x)
    };
  }
  if (trace[0].y !== undefined) {
    traceSpec = {
      ...traceSpec,
      y: trace.map(item => item.y)
    };
  }
  if (trace[0].label !== undefined) {
    traceSpec = {
      ...traceSpec,
      labels: trace.map(item => item.label)
    };
  }
  if (trace[0].value !== undefined) {
    traceSpec = {
      ...traceSpec,
      values: trace.map(item => item.value)
    };
  }

  return traceSpec;
}

export default WithDOMSize(
  withFetch(
    class Plot extends React.Component {
      static defaultProps = { icon: "plot" };

      constructor(props) {
        super(props);
        this.state = { plotly: null };
        this._plotElement = null;
      }

      render() {
        let {
          fetched: { data },
          ...props
        } = this.props;
        return (
          <Action {...props} flex={1} ref={this.setElementForDOMSize}>
            {data.updating || this.state.plotly === null ? (
              <rexui.PreloaderScreen />
            ) : (
              <VBox flexGrow={1} padding={5} ref={this._onPlotElement} />
            )}
          </Action>
        );
      }

      setElementForDOMSize = element => {
        this.props.setElementForDOMSize(ReactDOM.findDOMNode(element));
      };

      componentDidUpdate() {
        this.plot();
      }

      componentDidMount() {
        loadPlotly().then(plotly => {
          this.setState({ plotly });
          this.forceUpdate();
        });
      }

      _onPlotElement = plotElement => {
        this._plotElement = plotElement;
      };

      plot() {
        let {
          fetched: { data },
          plot,
          layout,
          DOMSize
        } = this.props;
        if (!this._plotElement || !DOMSize || data.updating) {
          return;
        }
        let dataSpec = Object.keys(data.data)
          .map(key => buildTraceSpec(data.data[key], plot, key))
          .filter(Boolean);
        let layoutSpec = {
          ...layout,
          width: DOMSize.width - 50,
          height: DOMSize.height - 80
        };
        let options = {
          modeBarButtonsToRemove: [
            "sendDataToCloud",
            "hoverClosestCartesian",
            "hoverCompareCartesian"
          ],
          displaylogo: false
        };
        let node = ReactDOM.findDOMNode(this._plotElement);
        this.state.plotly.newPlot(node, dataSpec, layoutSpec, options);
        this.state.plotly.Plots.resize(node);
      }
    },
    fetchPlotData
  ),
  { forceAsync: true }
);
