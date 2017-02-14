/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import * as stylesheet from '../../stylesheet';
import * as css from '../../css';
import {HBox} from '../../layout';
import {Icon} from '../../ui';
import Input from './Input';

function isEmpty(value) {
  return value == null || value == '';
}

export let IconButton = stylesheet.style(Icon, {
  opacity: 0.5,
  cursor: 'pointer',
  focus: {
    opacity: 1
  },
  hoverable: {
    hover: {
      opacity: 0.7
    }
  }
});

let Root = stylesheet.style(HBox, {
  padding: css.padding(0, 10),
  opacity: 0.5,
  margin: css.margin(10,0),
  border: css.border(1,'#666'),
  borderRadius: 2,
  alignItems: 'center',
  focus: {
    opacity: 1
  },
});

export default class SearchInput extends React.Component {

  static defaultProps = {
    debounce: 500,
    placeholder: 'Search...',
  };

  constructor(props) {
    super(props);
    this.state = {focus: false};
    this._input = null;
  }

  render() {
    let {placeholder, debounce, value, onChange} = this.props;
    let {focus} = this.state;
    return (
      <Root variant={{focus}} onClick={this.focus}>
        <IconButton name="search" variant={{focus}} onClick={this.focus} />
        <Input
          ref={this.onInputRef}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          variant={{noBorder: true}}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          debounce={debounce}
          />
        {!isEmpty(value) &&
          <IconButton
            name="remove"
            variant={{hoverable: true}}
            onClick={this.clear}
            />}
      </Root>
    );
  }

  clear = () => {
    this.props.onChange(null);
    this.focus();
  };

  focus = () => {
    if (this._input) {
      ReactDOM.findDOMNode(this._input).focus();
    }
  };

  onInputRef = (input) => {
    this._input = input;
  };

  onFocus = () => {
    this.setState({focus: true});
  };

  onBlur = () => {
    this.setState({focus: false});
  };
}

