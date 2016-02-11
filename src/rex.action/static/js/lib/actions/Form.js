/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import * as form from 'rex-widget/form';
import * as ui from 'rex-widget/ui';
import * as data from 'rex-widget/data';

import Action from '../Action';
import * as ObjectTemplate from '../ObjectTemplate';
import * as ContextUtils from '../ContextUtils';
import Title from './Title';
import applyContext from '../applyContext';

@data.Fetch(function fetchInitialValue({dataValue, value, contextTypes, context}) {
  let spec = {};
  if (typeof value === 'string') {
    spec.value = applyContext(dataValue, contextTypes.input, context, {query: true});
  }
  return spec;
})
export default class Form extends React.Component {

  static defaultProps = {
    icon: 'pencil',
    submitButton: 'Submit'
  };

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
    let {submitButton, icon} = this.props;
    return (
      <ui.SuccessButton icon={icon} onClick={this._onSubmit}>
        {submitButton}
      </ui.SuccessButton>
    );
  }

  @autobind
  renderForm() {
    let {dataMutation, fields, context, contextTypes, fetched} = this.props;
    let submitTo = applyContext(
        dataMutation,
        contextTypes.input,
        context);
    return (
      <form.ConfigurableForm
        ref="form"
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={submitTo}
        submitButton={null}
        onSubmitComplete={this._onSubmitComplete}
        value={this.initialValue}
        fields={fields}
        />
    );
  }

  @autobind
  _onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  }

  @autobind
  _onSubmitComplete(value) {
    let {entity, refetch, onContext} = this.props;
    if (value !== null && entity) {
      value = value[entity.type.name][0];
      onContext({
        [entity.name]: value
      });
    }
    refetch();
  }

  static renderTitle({title = `Form`}, context) {
    return <span>{title}</span>;
  }

  static getTitle({title}) {
    return title || `Form`;
  }
}
