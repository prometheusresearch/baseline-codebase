/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {autobind, emptyFunction} from '../../lang';
import * as Schema from './Schema';
import EntityForm from './EntityForm';
import FormColumn from './FormColumn';
import makeEnumerator from './makeEnumerator';
import immupdate from 'immupdate';


/**
 * Form which has fieldset configurable through URL mapping.
 *
 * @public
 */
export default class ConfigurableEntityForm extends React.Component {

  static propTypes = {
    ...EntityForm.PropTypes,

    /**
     * An array of form field specifications.
     */
    fields: React.PropTypes.array.isRequired,

    /**
     * When ``true``, no submit button is rendered.
     */
    readOnly: React.PropTypes.bool,

    /**
     * When **layout** === ``'row'``, 
     * the form fields are arranged horizontally;
     * otherwise vertically.
     */
    layout: React.PropTypes.string,

    /**
     * The submit button element to use.
     */
    submitButton: React.PropTypes.element
  };

  static defaultProps = {
    layout: 'column',
    onChange: emptyFunction.thatReturnsArgument,
  };

  constructor(props) {
    super(props);
    this._schema = Schema.fromFields(this.props.fields);
  }

  render() {
    let {fields, readOnly, layout, submitButton, ...props} = this.props;
    return (
      <EntityForm
        {...props}
        ref="form"
        schema={this._schema}
        onChange={this.onChange}
        submitButton={readOnly ? null : submitButton}>
        <FormColumn
          fields={fields}
          fieldProps={{readOnly}}
          />
      </EntityForm>
    );
  }

  componentWillReceiveProps({fields, schema}) {
    if (schema !== this.props.schema || fields !== this.props.fields) {
      this._schema = Schema.fromFields(fields);
    }
  }

  @autobind
  onChange(value, prevValue) {
    let {entity} = this.props;
    let valueToFilter = value[entity][0];
    let filteredValue = filterValue(valueToFilter, this._schema.hideIfList);
    if (valueToFilter !== filteredValue) {
      value = {[entity]: [filteredValue]};
    }
    return this.props.onChange(value, prevValue);
  }

  @autobind
  submit() {
    return this.refs.form.submit();
  }
}

function filterValue(value, hideIfList) {
  if (!hideIfList || hideIfList.length === 0) {
    return value;
  }
  for (let i = 0; i < hideIfList.length; i++) {
    let hideIf = hideIfList[i];
    // TODO: move that to deserialization phase
    if (hideIf.keyPathPatternEnumerate === undefined) {
      hideIf.keyPathPatternEnumerate = makeEnumerator(hideIf.keyPathPattern);
    }
    let items = hideIf.keyPathPatternEnumerate(value);
    if (items.length === 0) {
      continue;
    }
    for (let j = 0; j < items.length; j++) {
      let item = items[j];
      if (hideIf.hideIf(item.value, item.parentValue)) {
        value = immupdate(value, item.keyPath.join('.'), undefined);
      }
    }
  }
  return value;
}
