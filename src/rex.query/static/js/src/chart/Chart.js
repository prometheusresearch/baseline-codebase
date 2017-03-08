/**
 * @flow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as ui from '../ui';
import * as State from '../state';
import * as model from './model';
import type {ChartSpec} from '../state';
import type {QueryPipeline} from '../model';
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

export default class Chart extends React.Component {
  static contextTypes = {
    actions: React.PropTypes.object,
  };

  context: {actions: State.Actions};
  props: ChartProps;

  render() {
    const {chartSpec, ...props} = this.props;
    const {label, chart} = chartSpec;
    let children;
    switch (chart.type) {
      case 'pie': {
        children = <PieChart {...props} chart={chart} onChart={this.onUpdateChart} />;
        break;
      }
      case 'line': {
        children = <LineChart {...props} chart={chart} onChart={this.onUpdateChart} />;
        break;
      }
      case 'area': {
        children = <AreaChart {...props} chart={chart} onChart={this.onUpdateChart} />;
        break;
      }
      case 'bar': {
        children = <BarChart {...props} chart={chart} onChart={this.onUpdateChart} />;
        break;
      }
      case 'scatter': {
        children = <ScatterChart {...props} chart={chart} onChart={this.onUpdateChart} />;
        break;
      }
      default:
        children = null;
    }
    return (
      <VBox height={0} overflow="auto" flexGrow={1}>
        <HBox padding={10} justifyContent="space-between">
          <EditableHeader value={label} onChange={this.onUpdateLabel} />
          <ReactUI.QuietButton
            onClick={this.onRemoveChart}
            icon={<ui.Icon.IconRemove />}
          />
        </HBox>
        <VBox flexGrow={1}>
          {children}
        </VBox>
      </VBox>
    );
  }

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

class EditableHeader extends React.Component {
  static defaultProps = {
    onChange: _value => {},
  };

  _input: HTMLElement;

  props: {value: string, onChange: (string) => *};

  state: {value: ?string} = {value: null};

  onEditStart = () => {
    this.setState({value: this.props.value});
  };

  onEditCommit = () => {
    const {value} = this.state;
    this.setState({value: null});
    this.props.onChange(value || this.props.value);
  };

  onEditCancel = () => {
    this.setState({value: null});
  };

  onChange = (e: KeyboardEvent) => {
    const value: string = (e.target: any).value;
    this.setState({value});
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.onEditCommit();
    } else if (e.key === 'Escape') {
      this.onEditCancel();
    }
  };

  onInput = input => {
    if (this._input == null) {
      const wrapperNode = ReactDOM.findDOMNode(input);
      const node = wrapperNode.querySelector('input');
      if (node != null) {
        node.focus();
      }
    }
    this._input = input;
  };

  render() {
    const {value} = this.props;
    const edit = this.state.value != null;
    return (
      <VBox>
        {edit
          ? <HBox
              ref={this.onInput}
              paddingLeft={20}
              paddingRight={20}
              paddingTop={20}
              paddingBottom={10}>
              <ReactUI.Input
                value={this.state.value}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
              />
              <ReactUI.QuietButton
                onClick={this.onEditCommit}
                size="small"
                icon={<ui.Icon.IconCheck />}
              />
              <ReactUI.QuietButton
                onClick={this.onEditCancel}
                size="small"
                icon={<ui.Icon.IconClose />}
              />
            </HBox>
          : <ui.Header onClick={this.onEditStart}>{value}</ui.Header>}
      </VBox>
    );
  }
}
