/**
 * @flow
 */

import React from 'react';
import moment from 'moment';
import * as ReactUI from '@prometheusresearch/react-ui';

import Select from '../Select';
import {DatePicker, TimePicker, DateTimePicker} from '../DateTime';

type TextOperandProps = {
  type: string;
  value: string;
  onChange: (value: ?string) => *;
};

export class TextOperand extends React.Component<*, TextOperandProps, *> {

  render() {
    let {value, ...props} = this.props;
    return (
      <ReactUI.Input
        {...props}
        type={undefined}
        value={value == null ? '' : value}
        onChange={this.onChange}
        placeholder="Enter a Value..."
        />
    );
  }

  onChange = (event: any) => {
    let target = event.target;
    this.props.onChange(target.value || null);
  };
}

type NumberOperandProps = {
  value: string;
  onChange: (value: number) => *;
};

export class NumberOperand extends React.Component<*, NumberOperandProps, *> {

  state: {
    value: string;
    error: boolean;
  };

  constructor(props: NumberOperandProps) {
    super(props);
    this.state = {
      value: props.value,
      error: false
    };
  }

  componentWillReceiveProps(nextProps: NumberOperandProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: nextProps.value,
        error: false,
      });
    }
  }

  render() {
    return (
      <TextOperand
        variant={{'error': this.state.error}}
        value={this.state.value}
        onChange={this.onChange}
        />
    );
  }

  onChange = (value: string) => {
    let num = Number(value);
    if ((value != null) && (num.toString() === value)) {
      this.setState({value, error: false}, () => { this.props.onChange(num); });
    } else {
      this.setState({value, error: true});
    }
  };
}


export class EnumerationOperand extends React.Component {
  render() {
    return (
      <Select
        value={this.props.value}
        options={this.props.options}
        onChange={this.props.onChange}
        placeholder="Select a Value..."
        />
    );
  }
}


// TODO: refactor date/time/datetime operands -- lots of cut&paste

export class DateOperand extends React.Component {

  state: any;

  constructor(props: any) {
    super(props);
    this.state = {
      moment: props.value ? moment(props.value) : null,
      pickerShowing: false,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      moment: nextProps.value ? moment(nextProps.value) : null,
    });
  }

  render() {
    let {moment, pickerShowing} = this.state;

    return (
      <ReactUI.Block>
        <ReactUI.Input
          value={moment == null ? '' : moment.format('YYYY-MM-DD')}
          readOnly
          style={{
            cursor: 'pointer',
          }}
          placeholder="Choose a Date..."
          onClick={this.onShowPicker}
          />
        {pickerShowing &&
          <ReactUI.Block
            style={{
              position: 'absolute',
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: 2,
              padding: 5,
              marginTop: 5,
              minWidth: '100%',
            }}>
            <DatePicker
              moment={this.state.moment}
              onChange={this.onChange}
              onCancel={this.onCancel}
              />
          </ReactUI.Block>
        }
      </ReactUI.Block>
    );
  }

  onShowPicker = () => {
    this.setState({
      pickerShowing: true,
    });
  };

  onChange = (moment: any) => {
    this.setState({
      pickerShowing: false,
    }, () => { this.props.onChange(moment.format('YYYY-MM-DD')); });
  };

  onCancel = () => {
    this.setState({
      pickerShowing: false,
    });
  };
}


export class TimeOperand extends React.Component {

  state: any;

  constructor(props: any) {
    super(props);
    this.state = {
      moment: props.value ? moment(props.value, 'HH:mm:ss') : null,
      pickerShowing: false,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      moment: nextProps.value ? moment(nextProps.value, 'HH:mm:ss') : null,
    });
  }

  render() {
    let {moment, pickerShowing} = this.state;

    return (
      <ReactUI.Block>
        <ReactUI.Input
          value={moment == null ? '' : moment.format('HH:mm:ss')}
          readOnly
          style={{
            cursor: 'pointer',
          }}
          placeholder="Choose a Time..."
          onClick={this.onShowPicker}
          />
        {pickerShowing &&
          <ReactUI.Block
            style={{
              position: 'absolute',
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: 2,
              padding: 5,
              marginTop: 5,
              minWidth: '100%',
            }}>
            <TimePicker
              moment={this.state.moment}
              showSeconds={true}
              onChange={this.onChange}
              onCancel={this.onCancel}
              />
          </ReactUI.Block>
        }
      </ReactUI.Block>
    );
  }

  onShowPicker = () => {
    this.setState({
      pickerShowing: true,
    });
  };

  onChange = (moment: any) => {
    this.setState({
      pickerShowing: false,
    }, () => { this.props.onChange(moment.format('HH:mm:ss')); });
  };

  onCancel = () => {
    this.setState({
      pickerShowing: false,
    });
  };
}


export class DateTimeOperand extends React.Component {

  state: any;

  constructor(props: any) {
    super(props);
    this.state = {
      moment: props.value ? moment(props.value, 'YYYY-MM-DD HH:mm:ss') : null,
      pickerShowing: false,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      moment: nextProps.value ? moment(nextProps.value, 'YYYY-MM-DD HH:mm:ss') : null,
    });
  }

  render() {
    let {moment, pickerShowing} = this.state;

    return (
      <ReactUI.Block>
        <ReactUI.Input
          value={moment == null ? '' : moment.format('YYYY-MM-DD HH:mm:ss')}
          readOnly
          style={{
            cursor: 'pointer',
          }}
          placeholder="Choose a Date/Time..."
          onClick={this.onShowPicker}
          />
        {pickerShowing &&
          <ReactUI.Block
            style={{
              position: 'absolute',
              zIndex: 9999,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: 2,
              padding: 5,
              marginTop: 5,
              minWidth: '100%',
            }}>
            <DateTimePicker
              moment={this.state.moment}
              showSeconds={true}
              onChange={this.onChange}
              onCancel={this.onCancel}
              />
          </ReactUI.Block>
        }
      </ReactUI.Block>
    );
  }

  onShowPicker = () => {
    this.setState({
      pickerShowing: true,
    });
  };

  onChange = (moment: any) => {
    this.setState({
      pickerShowing: false,
    }, () => { this.props.onChange(moment.format('YYYY-MM-DD HH:mm:ss')); });
  };

  onCancel = () => {
    this.setState({
      pickerShowing: false,
    });
  };
}


export class MultiEnumerationOperand extends React.Component {
  render() {
    return (
      <Select
        multi={true}
        value={this.props.value}
        options={this.props.options}
        onChange={this.props.onChange}
        placeholder="Select Some Values..."
        />
    );
  }
}