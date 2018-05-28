/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

export default class Radio extends React.Component {

  render() {
    return (
      <input
        type="radio"
        style={this.props.style}
        checked={this.props.value}
        onChange={this.onChange}
        />
    );
  }

  onChange = (e) => {
    this.props.onChange(e.target.checked);
  };
}

