/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as ReactForms from 'react-forms';
import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import noop from 'lodash/noop';

import {InjectI18N} from 'rex-i18n';

import {isComplete} from './Discrepancy';
import DiscrepancyList from './DiscrepancyList';
import {fromDiscrepancies} from './schema';
import {createReactFormsMessages} from '../instrument/validate';
import FormContext from '../form/FormContext';


@InjectI18N
export default class Reconciler extends React.Component {

  static defaultProps = {
    parameters: {},
    onComplete: noop,
    onChange: noop,
  };

  static propTypes = {
    discrepancies: React.PropTypes.object.isRequired,
    entries: React.PropTypes.array.isRequired,
    instrument: React.PropTypes.object.isRequired,
    form: React.PropTypes.object.isRequired,
    onComplete: React.PropTypes.func.isRequired,
    onChange: React.PropTypes.func.isRequired,
    parameters: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    let {discrepancies, instrument, form} = props;
    let i18n = this.getI18N();
    let messages = createReactFormsMessages({i18n});
    this.state = {
      formValue: ReactForms.createValue({
        schema: fromDiscrepancies(discrepancies, instrument, form, {i18n}),
        onChange: this.onChange,
        validate: (schema, value) => {
          return ReactForms.Schema.validate(schema, value, {messages});
        },
      }),
    };
  }

  render() {
    let {form, parameters, discrepancies, entries} = this.props;
    let {formValue} = this.state;
    return (
      <FormContext
        self={this}
        form={form}
        parameters={parameters}
        events={null}>
        <div>
          <DiscrepancyList
            entries={entries}
            formValue={formValue}
            />
          <ReactUI.Block>
            <ReactUI.SuccessButton
              disabled={!isComplete(formValue, discrepancies)}
              onClick={this.onComplete}>
              {this._('Complete Reconciliation')}
            </ReactUI.SuccessButton>
          </ReactUI.Block>
        </div>
      </FormContext>
    );
  }

  componentWillReceiveProps({form, instrument, parameters, discrepancies}) {
    if (form !== this.props.form) {
      console.warning( // eslint-disable-line no-console
        '<Reconciler /> does not handle updating "form" prop'
      );
    }
    if (instrument !== this.props.instrument) {
      console.warning( // eslint-disable-line no-console
        '<Reconciler /> does not handle updating "instrument" prop'
      );
    }
    if (parameters !== this.props.parameters) {
      console.warning( // eslint-disable-line no-console
        '<Reconciler /> does not handle updating "parameters" prop'
      );
    }
    if (discrepancies !== this.props.discrepancies) {
      console.warning( // eslint-disable-line no-console
        '<Reconciler /> does not handle updating "discrepancies" prop'
      );
    }
  }

  onComplete = () => {
    this.props.onComplete(this.state.formValue.value);
  };

  onChange = (formValue) => {
    this.props.onChange(formValue.value);
    this.setState({formValue});
  };
}
