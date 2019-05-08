/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import PropTypes from "prop-types";
import * as rexui from "rex-ui";

import * as form from "rex-widget/conf-form";
import { SuccessButton } from "rex-ui";
import * as ui from "rex-widget/ui";
import * as data from "rex-widget/data";

import type { Entity } from "../model/types";
import Action from "../Action";
import * as ObjectTemplate from "../ObjectTemplate";
import * as ContextUtils from "../ContextUtils";
import Title from "./Title";
import fetchEntity from "./fetchEntity";

type Form = {
  submit: Function
};

export class Edit extends React.Component {
  static propTypes = {
    context: PropTypes.object,
    onCommand: PropTypes.func
  };

  static defaultProps = {
    width: 400,
    icon: "pencil",
    submitButton: "Submit",
    value: {}
  };

  _form: ?Form = null;

  state: { submitInProgress: boolean } = { submitInProgress: false };

  render() {
    let { onClose, width, fetched, context } = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action
        width={width}
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}
      >
        {!fetched.entity.updating ? (
          this.renderForm()
        ) : (
          <rexui.PreloaderScreen />
        )}
      </Action>
    );
  }

  renderFooter = () => {
    let { submitButton, icon } = this.props;
    return (
      <SuccessButton
        color="primary"
        variant="contained"
        disabled={this.state.submitInProgress}
        onClick={this._onSubmit}
        icon={<ui.Icon name={icon} />}
      >
        {submitButton}
      </SuccessButton>
    );
  };

  renderForm = () => {
    let { entity, fields, value, context, contextTypes, fetched } = this.props;
    value = mergeDeepInto(
      fetched.entity.data,
      ObjectTemplate.render(value, context)
    );
    let submitTo = this.props.dataMutation.params(
      ContextUtils.contextToParams(context, contextTypes.input)
    );
    return (
      <form.ConfEntityForm
        confirmNavigationIfDirty={true}
        ref={this._onForm}
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={submitTo}
        submitButton={null}
        onBeforeSubmit={this.onBeforeSubmit}
        onSubmitError={this.onSubmitError}
        onSubmitComplete={this.onSubmitComplete.bind(
          null,
          context[entity.name]
        )}
        initialValue={fetched.entity.data}
        value={value}
        entity={entity.type.name}
        fields={fields}
      />
    );
  };

  _onForm = (form: ?Form) => {
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

  onSubmitComplete = (prevEntity: Entity, nextEntity: ?Entity) => {
    this.setState({ submitInProgress: false }, () => {
      this.props.onEntityUpdate(prevEntity, nextEntity);
    });
  };

  onSubmitError = () => {
    this.setState({ submitInProgress: false });
  };

  static renderTitle({ entity, title = `Edit ${entity.name}` }, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
    return props.title || `Edit ${props.entity.name}`;
  }
}

export default data.Fetch(fetchEntity)(Edit);

function mergeDeepInto(a, b) {
  a = { ...a };
  for (let k in b) {
    if (b.hasOwnProperty(k)) {
      if (typeof b[k] === "object") {
        a[k] = mergeDeepInto(a[k], b[k]);
      } else {
        a[k] = b[k];
      }
    }
  }
  return a;
}
