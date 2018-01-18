/**
 * @flow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {HBox, Element} from 'react-stylesheet';
import * as recharts from 'recharts';
import * as ReactUI from '@prometheusresearch/react-ui';
import Tether from 'tether';

import Layer from '../Layer';
import * as ui from '../ui';
import {findDOMNodeStrict as findDOMNode} from '../findDOMNode';

const TETHER_CONFIG = {
  attachment: 'top left',
  targetAttachment: 'top left',
  optimizations: {
    moveElement: false,
  },
  constraints: [
    {
      to: 'window',
      attachment: 'together',
    },
  ],
};

type OnChange = string => *;

type ChartTitleProps = {
  width: number,
  left: string | number,
  value: string,
  onChange?: ?OnChange,
};
type ChartTitleState = {value: ?string};

export default class ChartTitle extends React.Component<
  ChartTitleProps,
  ChartTitleState,
> {
  _input: HTMLElement;
  _tether: any;

  state = {value: null};

  onEditStart = () => {
    this.setState({value: this.props.value});
  };

  onEditCommit = () => {
    const {value} = this.state;
    this.setState({value: null});
    if (this.props.onChange) {
      this.props.onChange(value || this.props.value);
    }
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

  onInput = (input: any) => {
    if (this._input == null) {
      const wrapperNode = findDOMNode(input);
      const node = wrapperNode.querySelector('input');
      if (node != null) {
        node.focus();
      }
    }
    this._input = input;
  };

  _layerDidMount = (element: HTMLElement) => {
    const target: HTMLElement = (ReactDOM.findDOMNode(this): any);
    const size = target.getBoundingClientRect();
    element.style.width = `${size.width}px`;
    this._tether = new Tether({element, target, ...TETHER_CONFIG});
  };

  _layerDidUpdate = () => {
    this._tether.position();
  };

  _layerWillUnmount = () => {
    this._tether.disable();
    this._tether = null;
  };

  render() {
    const {left, width, value, onChange} = this.props;
    const edit = this.state.value != null;
    return (
      <g>
        <foreignObject x={100 / 2} y="0" width={width - 100} height="100">
          <Element position="relative">
            {!edit
              ? <Element textAlign="center" fontWeight="200" fontSize="14pt">
                  {value}
                </Element>
              : <HBox width={width - 100} padding={2} ref={this.onInput}>
                  <ReactUI.Input
                    style={{marginRight: 5}}
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
                </HBox>}
            {onChange &&
              <div
                style={{padding: 3, position: 'absolute', top: 0, left: -50}}
                className="hide-for-export">
                <ReactUI.QuietButton
                  onClick={this.onEditStart}
                  size="small"
                  icon={<ui.Icon.IconPencil />}
                />
              </div>}
          </Element>
        </foreignObject>
      </g>
    );
  }
}
