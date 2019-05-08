/**
 * @copyright 2015, Prometheus Research, LLC
 * @noflow
 */

import * as React from "react";

import * as ui from "rex-widget/ui";
import { SuccessButton } from "rex-ui";
import * as form from "rex-widget/conf-form";
import { emptyFunction } from "rex-widget/lang";

import type { EntityType } from "../model/types";
import { defineCommand, Types } from "../model/Command";
import Action from "../Action";
import * as ObjectTemplate from "../ObjectTemplate";
import * as ContextUtils from "../ContextUtils";

type MakeProps = {
  width: number,
  icon: string,
  kind: string,
  onSubmitComplete: Function,
  submitButton: string,
  context: Object,
  contextTypes: Object,
  value: Object,
  onCommand: Function,
  onClose: Function,
  refetch: Function,
  fields: Object,
  entity: { name: string, type: EntityType }
};

export default class Make extends React.Component {
  props: MakeProps;

  state: {
    key: number,
    submitInProgress: boolean
  } = { key: 1, submitInProgress: false };

  _form: ?{ submit: Function } = null;

  static defaultProps = {
    width: 400,
    icon: "plus",
    kind: "success",
    onSubmitComplete: emptyFunction,
    submitButton: "Submit",
    value: {}
  };

  render() {
    let { fields, entity, onClose, width, context, contextTypes } = this.props;
    let value = ObjectTemplate.render(this.props.value, context);
    let title = this.constructor.getTitle(this.props);
    return (
      <Action
        title={title}
        width={width}
        onClose={onClose}
        renderFooter={this.renderFooter}
      >
        <form.ConfEntityForm
          confirmNavigationIfDirty={true}
          insert={true}
          context={ContextUtils.getMaskedContext(context, contextTypes.input)}
          key={this.getKey()}
          ref={this._onForm}
          entity={entity.type.name}
          fields={fields}
          submitTo={this.props.dataMutation.params(
            ContextUtils.contextToParams(context, contextTypes.input)
          )}
          submitButton={null}
          onBeforeSubmit={this.onBeforeSubmit}
          onSubmitError={this.onSubmitError}
          onSubmitComplete={this.onSubmitComplete}
          value={value}
        />
      </Action>
    );
  }

  renderFooter = () => {
    let { submitButton, icon } = this.props;
    return (
      <SuccessButton
        variant="contained"
        color="primary"
        disabled={this.state.submitInProgress}
        onClick={this.onSubmit}
        icon={<ui.Icon name={icon} />}
      >
        {submitButton}
      </SuccessButton>
    );
  };

  _onForm = (form: { submit: Function }) => {
    this._form = form;
  };

  getKey() {
    let contextKey = Object.keys(this.props.contextTypes.input)
      .map(k => this.props.context[k])
      .join("__");
    return `${contextKey}__${this.state.key}`;
  }

  onSubmit = (e: UIEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this._form) {
      this._form.submit();
    }
  };

  onBeforeSubmit = () => {
    this.setState({ submitInProgress: true });
  };

  onSubmitComplete = (data: Object) => {
    this.props.onSubmitComplete(data);
    let key = this.state.key + 1;
    this.setState({ key, submitInProgress: false });
    this.props.onCommand("default", data);
    this.props.refetch();
  };

  onSubmitError = () => {
    this.setState({ submitInProgress: false });
  };

  static getTitle(props: MakeProps) {
    return props.title || `Make ${props.entity.name}`;
  }
}

defineCommand(Make, {
  argumentTypes: [Types.ConfigurableEntity()],
  execute(props, context, entity) {
    if (entity != null) {
      return { ...context, [props.entity.name]: entity };
    } else {
      return context;
    }
  }
});
