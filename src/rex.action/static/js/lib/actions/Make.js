/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import SubmitButton from '../ui/SubmitButton';
import * as form from 'rex-widget/form';
import {emptyFunction, autobind} from 'rex-widget/lang';
import {command, Types} from '../execution/Command';
import Action from '../Action';
import * as ObjectTemplate from '../ObjectTemplate';
import * as ContextUtils from '../ContextUtils';

export default class Make extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    width: 400,
    icon: 'plus',
    kind: 'success',
    onSubmitComplete: emptyFunction,
    submitButton: 'Submit',
    value: {},
  };

  constructor(props) {
    super(props);
    this._form = null;
    this.state = {
      key: 1,
      submitInProgress: false
    };
  }

  render() {
    let {
      fields, entity,
      onClose, width, context, contextTypes
    } = this.props;
    let value = ObjectTemplate.render(this.props.value, context);
    let title = this.constructor.getTitle(this.props);
    return (
      <Action
        title={title}
        width={width}
        onClose={onClose}
        renderFooter={this.renderFooter}>
        <form.ConfigurableEntityForm
          insert
          context={ContextUtils.getMaskedContext(context, contextTypes.input)}
          key={this.getKey()}
          ref={this._onForm}
          entity={entity.type.name}
          fields={fields}
          submitTo={this.props.dataMutation.params(ContextUtils.contextToParams(context, contextTypes.input))}
          submitButton={null}
          onBeforeSubmit={this.onBeforeSubmit}
          onSubmitError={this.onSubmitError}
          onSubmitComplete={this.onSubmitComplete}
          value={value}
          />
      </Action>
    );
  }

  @autobind
  renderFooter() {
    let {submitButton, icon} = this.props;
    return (
      <SubmitButton
        disabled={this.state.submitInProgress}
        onClick={this.onSubmit}
        icon={icon}>
        {submitButton}
      </SubmitButton>
    );
  }

  @autobind
  _onForm(form) {
    this._form = form;
  }

  getKey() {
    let contextKey = Object
      .keys(this.props.contextTypes.input)
      .map(k => this.props.context[k])
      .join('__');
    return `${contextKey}__${this.state.key}`;
  }

  @autobind
  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this._form.submit();
  }

  @autobind
  onBeforeSubmit(_value) {
    this.setState({submitInProgress: true});
  }

  @autobind
  onSubmitComplete(data) {
    this.props.onSubmitComplete(data);
    let key = this.state.key + 1;
    this.setState({key, submitInProgress: false});
    this.props.onCommand('default', data);
    this.props.refetch();
  }

  @autobind
  onSubmitError() {
    this.setState({submitInProgress: false});
  }

  static getTitle(props) {
    return props.title || `Make ${props.entity.name}`;
  }

  static commands = {

    @command(Types.ConfigurableEntity())
    default(props, context, entity) {
      if (entity != null) {
        return {...context, [props.entity.name]: entity};
      } else {
        return context;
      }
    }
  };
}
