/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Button             from './Button';

export default class Minute extends React.Component {

  static propTypes = {
    minute: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  render() {
    let {minute, ...props} = this.props;
    return (
      <td>
        <Button size={{width: 32}} onClick={this.onClick}>
          {minute}
        </Button>
      </td>
    );
  }

  onClick = () => {
    this.props.onClick(this.props.minute);
  }
}
