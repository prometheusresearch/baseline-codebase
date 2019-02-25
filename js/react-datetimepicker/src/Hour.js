/**
 * @copyright 2014 Quri, Loïc CHOLLIER
 * @copyright 2015 Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Button             from './Button';

export default class Hour extends React.Component {

  static propTypes = {
    hour: PropTypes.number,
    onClick: PropTypes.func,
  };

  render() {
    let {hour} = this.props;
    return (
      <td>
        <Button size={{width: 32}} onClick={this.onClick}>
          {hour}
        </Button>
      </td>
    );
  }

  onClick = () => {
    this.props.onClick(this.props.hour);
  }
}
