/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import { emptyFunction } from "../lang";
import * as Schema from "../form/Schema";
import EntityForm from "../form/EntityForm";
import { ERROR_SENTINEL } from "../form/Form";
import filterFormValue from "./filterFormValue";
import { ConfColumn } from "./Layout";
import { validate, validatorFromFields } from "./ConfForm";

/**
 * Form which has fieldset configurable through URL mapping.
 *
 * @public
 */
export class ConfEntityForm extends React.Component {
  // static propTypes = {
  //   ...EntityForm.PropTypes,

  //   /**
  //    * An array of form field specifications.
  //    */
  //   fields: PropTypes.array.isRequired,

  //   /**
  //    * Disable validation.
  //    */
  //   disableValidation: PropTypes.bool,

  //   /**
  //    * When ``true``, no submit button is rendered.
  //    */
  //   readOnly: PropTypes.bool,

  //   /**
  //    * When **layout** === ``'row'``,
  //    * the form fields are arranged horizontally;
  //    * otherwise vertically.
  //    */
  //   layout: PropTypes.string,

  //   /**
  //    * The submit button element to use.
  //    */
  //   submitButton: PropTypes.node
  // };

  static defaultProps = {
    layout: "column",
    onChange: emptyFunction.thatReturnsArgument
  };

  constructor(props) {
    super(props);
    this._schema = null;
    this._form = null;

    if (!this.props.disableValidation) {
      this._schema = Schema.fromFields(this.props.fields);
      this._validator = validatorFromFields(this.props.fields);
    }
  }

  render() {
    let {
      fields,
      readOnly,
      layout,
      submitButton,
      disableValidation: _disableValdation,
      ...props
    } = this.props;
    return (
      <EntityForm
        {...props}
        ref={this.onForm}
        schema={this._schema}
        validate={this._validator && this._validate}
        onChange={this.onChange}
        submitButton={readOnly ? null : submitButton}
      >
        <ConfColumn fields={fields} fieldProps={{ readOnly }} />
      </EntityForm>
    );
  }

  componentWillReceiveProps({ fields }) {
    if (fields !== this.props.fields) {
      this._schema = Schema.fromFields(fields);
      this._validator = validatorFromFields(fields);
    }
  }

  _validate = (root, errorList) => {
    const hasErrorByKeyPath = {};
    for (const error of errorList) {
      if (error[ERROR_SENTINEL]) {
        continue;
      }
      hasErrorByKeyPath[error.field] = true;
    }
    const filter = item => {
      const keyPath = `data.${this.props.entity}.0.${item.valueKey.join(".")}`;
      return !hasErrorByKeyPath[keyPath];
    };
    return validate(this._validator, root, this.props.context, { filter });
  };

  onChange = (value, prevValue) => {
    let { entity } = this.props;
    let valueToFilter = value[entity][0];
    let filteredValue = filterFormValue(valueToFilter, this._schema.hideIfList);
    if (valueToFilter !== filteredValue) {
      value = { [entity]: [filteredValue] };
    }
    return this.props.onChange(value, prevValue);
  };

  onForm = form => {
    this._form = form;
  };

  submit = () => {
    return this._form.submit();
  };
}
