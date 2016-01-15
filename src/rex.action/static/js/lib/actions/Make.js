/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import React                from 'react';
import RexWidget            from 'rex-widget';
import {SuccessButton}      from 'rex-widget/ui';
import emptyFunction        from 'rex-widget/lib/emptyFunction';
import {command, Types}     from '../execution/Command';
import Action               from '../Action';
import * as ObjectTemplate  from '../ObjectTemplate';
import * as ContextUtils    from '../ContextUtils';
import applyContext         from '../applyContext';

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
  };

  constructor(props) {
    super(props);
    this.state = {key: 1};
  }

  render() {
    let {
      fields, entity,
      submitButton, onClose, width, context, contextTypes
    } = this.props;
    let value = ObjectTemplate.render(this.props.value, context);
    let title = this.constructor.getTitle(this.props);
    return (
      <Action
        title={title}
        width={width}
        onClose={onClose}
        renderFooter={this.renderFooter}>
        <RexWidget.Forms.ConfigurableEntityForm
          insert
          context={ContextUtils.getMaskedContext(context, contextTypes.input)}
          key={this.getKey()}
          ref="form"
          entity={entity.type.name}
          fields={fields}
          submitTo={applyContext(this.props.dataMutation.port, contextTypes.input, context)}
          submitButton={null}
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
      <SuccessButton
        onClick={this.onSubmit}
        icon={icon}>
        {submitButton}
      </SuccessButton>
    );
  }

  getKey() {
    var contextKey = Object
      .keys(this.props.contextTypes.input)
      .map(k => this.props.context[k])
      .join('__');
    return `${contextKey}__${this.state.key}`;
  }

  @autobind
  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  }

  @autobind
  onSubmitComplete(data) {
    this.props.onSubmitComplete(data);
    var key = this.state.key + 1;
    this.setState({key});
    this.props.onCommand('default', data);
    this.props.refetch();
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
