/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';

import * as form from 'rex-widget/form';
import * as ui from 'rex-widget/ui';
import * as data from 'rex-widget/data';

import Action from '../Action';
import * as ObjectTemplate from '../ObjectTemplate';
import * as ContextUtils from '../ContextUtils';
import Title from './Title';
import fetchEntity from './fetchEntity';
import applyContext from '../applyContext';

@data.Fetch(fetchEntity)
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
    let {onClose, width, fetched, context} = this.props;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action
        width={width}
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}>
        {!fetched.entity.updating ?
          this.renderForm() :
          <ui.Preloader />}
      </Action>
    );
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
    let {entity, fields, value, context, contextTypes, fetched} = this.props;
    value = mergeDeepInto(
      fetched.entity.data,
      ObjectTemplate.render(value, context)
    );
    let submitTo = applyContext(
        this.props.dataMutation,
        contextTypes.input,
        context);
    return (
      <form.ConfigurableEntityForm
        ref="form"
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={submitTo}
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
