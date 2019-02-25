/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import DateTimePicker from '@prometheusresearch/react-datetimepicker';
import {style} from '../../stylesheet';
import {HBox} from '../../layout';
import {FlatButton} from '../../ui';
import BaseInput from './Input';

let StyledInput = style(BaseInput, {
  Root: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRight: 'none',
  }
});

class Input extends React.Component {
  render() {
    return <StyledInput {...this.props} debounce={0} onChange={this.onChange} />;
  }

  onChange = (value) =>
    this.props.onChange({target: {value: value || ''}});
}

export default style(DateTimePicker, {
  Root: {
    Component: HBox,
    flex: 1,
  },
  Field: {
    Component: HBox,
    flex: 1,
  },
  Input: Input,
  Button(props) {
    return <FlatButton {...props} icon="calendar" children={null} />;
  }
});
