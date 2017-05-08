/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import moment from 'moment';
import debounce from 'lodash/debounce';

import {HBox, VBox, css} from 'react-stylesheet';

import Filter from './Filter';
import DateInput from './DateInput';


export default class DateTimeBasedFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      min: null,
      max: null,
      errors: [],
    };
    props.filterState.forEach((flt) => {
      if (flt.op === '>=') {
        this.state.min = moment(flt.value, this.props.paramsFormat).format('x');
      } else if (flt.op === '<=') {
        this.state.max = moment(flt.value, this.props.paramsFormat).format('x');
      }
    });

    this._onChange = debounce((value) => {
      let params = [];

      if (this.state.min != null) {
        params.push({
          id: this.props.id,
          value: moment(this.state.min, 'x').format(this.props.paramsFormat),
          op: '>=',
        });
      }
      if (this.state.max != null) {
        params.push({
          id: this.props.id,
          value: moment(this.state.max, 'x').format(this.props.paramsFormat),
          op: '<=',
        });
      }

      this.props.onUpdate(params);
    }, 500);
  }

  onChange(field, value) {
    if (value === 'Invalid date') {
      this.setState({
        errors: this.state.errors.concat([field]),
      });
    } else {
      this.setState(
        {
          [field]: value,
          errors: this.state.errors.filter((err) => err !== field),
        },
        () => {
          this._onChange();
        }
      );
    }
  }

  render() {
    let {config, displayFormat, mode, layout} = this.props;
    let {min, max, errors} = this.state;

    let Container, minStyle, maxStyle;
    if (layout === 'vertical') {
      Container = VBox;
      minStyle = {marginBottom: 5};
      maxStyle = {marginTop: 5};
    } else {
      Container = HBox;
      minStyle = {marginRight: 5};
      maxStyle = {marginLeft: 5};
    }

    return (
      <Filter title={config.title}>
        <Container
          style={{
            padding: '5px 10px',
          }}>
          <div style={minStyle}>
            <DateInput
              placeholder="Min"
              error={errors.includes('min')}
              inputFormat={displayFormat}
              mode={mode}
              dateTime={min}
              onChange={this.onChange.bind(this, 'min')}
              />
          </div>
          <div style={maxStyle}>
            <DateInput
              placeholder="Max"
              error={errors.includes('max')}
              inputFormat={displayFormat}
              mode={mode}
              dateTime={max}
              onChange={this.onChange.bind(this, 'max')}
              />
          </div>
        </Container>
      </Filter>
    );
  }
}

