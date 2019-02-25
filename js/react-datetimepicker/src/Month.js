/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import moment               from 'moment';
import React, {PropTypes}   from 'react';
import Button               from './Button';

const MONTHS_SHORT = moment.monthsShort();

export default class Month extends React.Component {

  static propTypes = {
    month: PropTypes.number,
    active: PropTypes.bool,
    onClick: PropTypes.func,
  };

  render() {
    let {active, month, ...props} = this.props;
    return (
      <Button
        size={{width: 75, height: 32}}
        active={active}
        {...props}
        tabIndex={0}
        onClick={this.onClick}>
        {MONTHS_SHORT[month]}
      </Button>
    );
  }

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.month);
    }
  }
}

