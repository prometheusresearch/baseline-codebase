/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import * as form from 'rex-widget/form';
import * as ui from 'rex-widget/ui';
import * as data from 'rex-widget/data';

import SubmitButton from '../ui/SubmitButton';
import Action from '../Action';
import * as ObjectTemplate from '../ObjectTemplate';
import * as ContextUtils from '../ContextUtils';

export class Form extends React.Component {

  static defaultProps = {
    icon: 'pencil',
    submitButton: 'Submit'
  };

  constructor(props) {
    super(props);
    this._form = null;
    this.state = {
      submitInProgress: false
    };
  }

  render() {
    let {onClose, fetched, context} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}>
        {fetched.value && fetched.value.updating ?
          <ui.Preloader /> :
          this.renderForm()}
      </Action>
    );
  }

  get initialValue() {
    let {fetched, value, context} = this.props;
    return fetched.value ?
      fetched.value.data :
      ObjectTemplate.render(value || {}, context);
  }

  @autobind
  renderFooter() {
    let {readOnly, submitButton, icon} = this.props;
    return (
      readOnly ?
        null :
        <SubmitButton
          icon={icon}
          onClick={this._onSubmit}
          disabled={this.state.submitInProgress}>
          {submitButton}
        </SubmitButton>
    );
  }

  @autobind
  renderForm() {
    let {dataMutation, fields, context, contextTypes, readOnly} = this.props;
    let submitTo = dataMutation.params(
        ContextUtils.contextToParams(context, contextTypes.input));
    return (
      <form.ConfigurableForm
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
  }

  @autobind
  _onForm(form) {
    this._form = form;
  }

  @autobind
  _onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this._form.submit();
  }

  @autobind
  onBeforeSubmit(value) {
    this.setState({submitInProgress: true});
  }

  @autobind
  onSubmitComplete(value) {
    this.setState({submitInProgress: false}, () => {
      let {entity, refetch, onContext} = this.props;
      if (value !== null && entity) {
        value = value[entity.type.name][0];
        onContext({
          [entity.name]: value
        });
      }
      refetch();
    });
  }

  @autobind
  onSubmitError() {
    this.setState({submitInProgress: false});
  }

  static renderTitle({title = 'Form'}, _context) {
    return <span>{title}</span>;
  }

  static getTitle({title}) {
    return title || 'Form';
  }
}

export default data.Fetch(function fetchInitialValue({dataValue, value, contextTypes, context}) {
  let spec = {};
  if (typeof value === 'string') {
    spec.value = dataValue.params(
      ContextUtils.contextToParams(context, contextTypes.input, {query: true}));
  }
  return spec;
})(Form);
