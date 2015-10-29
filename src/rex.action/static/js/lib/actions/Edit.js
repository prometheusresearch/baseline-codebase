/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import autobind             from 'autobind-decorator';
import React                from 'react';
import RexWidget            from 'rex-widget';
import {Fetch}              from 'rex-widget/lib/data';
import Action               from '../Action';
import * as ObjectTemplate  from '../ObjectTemplate';
import * as ContextUtils    from '../ContextUtils';
import {SuccessButton}      from '../ui';
import {getEntityTitle}     from '../Entity';
import Title                from './Title';
import fetchEntity          from './fetchEntity';

@Fetch(fetchEntity)
export default class Edit extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    width: 400,
    icon: 'pencil',
    submitButton: 'Submit'
  };

  render() {
    let {onClose, width, fetched} = this.props;
    let title = this.constructor.getTitle(this.props);
    return (
      <Action
        width={width}
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}>
        {!fetched.entity.updating ?
          this.renderForm() :
          <RexWidget.Preloader />}
      </Action>
    );
  }

  @autobind
  renderFooter() {
    let {submitButton, icon} = this.props;
    return (
      <SuccessButton icon={icon} onClick={this._onSubmit}>
        {submitButton}
      </SuccessButton>
    );
  }

  @autobind
  renderForm() {
    let {entity, fields, value, context, contextTypes, fetched} = this.props;
    value = mergeDeepInto(
      fetched.entity.data,
      ObjectTemplate.render(value, context)
    );
    return (
      <RexWidget.Forms.ConfigurableEntityForm
        ref="form"
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={this.props.dataMutation}
        submitButton={null}
        onSubmitComplete={this._onSubmitComplete.bind(null, context[entity.name])}
        initialValue={fetched.entity.data}
        value={value}
        entity={entity.type.name}
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
  _onSubmitComplete(prevEntity, nextEntity) {
    this.props.onEntityUpdate(prevEntity, nextEntity);
  }

  static renderTitle({entity, title = `Edit ${entity.name}`}, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
    return props.title || `Edit ${props.entity.name}`;
  }
}

function mergeDeepInto(a, b) {
  a = {...a};
  for (var k in b) {
    if (b.hasOwnProperty(k)) {
      if (typeof b[k] === 'object') {
        a[k] = mergeDeepInto(a[k], b[k]);
      } else {
        a[k] = b[k];
      }
    }
  }
  return a;
}
