/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import React, {PropTypes}   from 'react';
import Button               from './Button';

export default class Year extends React.Component {

  static propTypes = {
    year: PropTypes.number,
    outOfRange: PropTypes.bool,
    active: PropTypes.bool,
    onClick: PropTypes.func,
  };

  render() {
    let {year, outOfRange, active, ...props} = this.props;
    return (
      <Button
        size={{width: 75, height: 32}}
        dimmed={outOfRange}
        active={active}
        {...props}
        onClick={this.onClick}
        tabIndex={0}>
        {year}
      </Button>
    );
  }

  onClick = () => {
    this.props.onClick(this.props.year);
  }
}
