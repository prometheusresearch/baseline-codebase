/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from "react";

import * as form from "rex-widget/conf-form";
import * as ui from "rex-widget/ui";
import * as data from "rex-widget/data";
import * as rexui from "rex-ui";

import Action from "../Action";
import * as ObjectTemplate from "../ObjectTemplate";
import * as ContextUtils from "../ContextUtils";

type FormComponent = {
  submit: Function
};

export class Form extends React.Component {
  static defaultProps = {
    icon: "pencil",
    submitButton: "Submit"
  };

  _form: ?FormComponent = null;
  state: { submitInProgress: boolean } = { submitInProgress: false };

  render() {
    let { onClose, fetched, context } = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action onClose={onClose} title={title} renderFooter={this.renderFooter}>
        {fetched.value && fetched.value.updating
          ? <rexui.PreloaderScreen />
          : this.renderForm()}
      </Action>
    );
  }

  get initialValue(): Object {
    let { fetched, value, context } = this.props;
    return fetched.value
      ? fetched.value.data
      : ObjectTemplate.render(value || {}, context);
  }

  renderFooter = () => {
    let { readOnly, submitButton, icon } = this.props;
    return readOnly
      ? null
      : <rexui.SuccessButton
          icon={<ui.Icon name={icon} />}
          onClick={this._onSubmit}
          disabled={this.state.submitInProgress}
        >
          {submitButton}
        </rexui.SuccessButton>;
  };

  renderForm = () => {
    let { dataMutation, fields, context, contextTypes, readOnly } = this.props;
    let submitTo = dataMutation.params(
      ContextUtils.contextToParams(context, contextTypes.input)
    );
    return (
      <form.ConfForm
        ref={this._onForm}
        readOnly={readOnly}
        disableValidation={readOnly}
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={submitTo}
        submitButton={null}
        onBeforeSubmit={this.onBeforeSubmit}
        onSubmitComplete={this.onSubmitComplete}
        onSubmitError={this.onSubmitError}
        value={this.initialValue}
        fields={fields}
      />
    );
  };

  _onForm = (form: ?FormComponent) => {
    this._form = form;
  };

  _onSubmit = (e: UIEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this._form != null) {
      this._form.submit();
    }
  };

  onBeforeSubmit = () => {
    this.setState({ submitInProgress: true });
  };

  onSubmitComplete = (value: Object) => {
    this.setState({ submitInProgress: false }, () => {
      let { entity, refetch, onContext } = this.props;
      if (value !== null && entity) {
        value = value[entity.type.name][0];
        onContext({
          [entity.name]: value
        });
      }
      refetch();
    });
  };

  onSubmitError = () => {
    this.setState({ submitInProgress: false });
  };

  static renderTitle({ title = "Form" }, _context) {
    return <span>{title}</span>;
  }

  static getTitle({ title }) {
    return title || "Form";
  }
}

export default data.Fetch(function fetchInitialValue({
  dataValue,
  value,
  contextTypes,
  context
}) {
  let spec = {};
  if (typeof value === "string") {
    spec.value = dataValue.params(
      ContextUtils.contextToParams(context, contextTypes.input, { query: true })
    );
  }
  return spec;
})(Form);
