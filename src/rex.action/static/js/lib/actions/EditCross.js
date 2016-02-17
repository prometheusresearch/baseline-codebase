/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import React                from 'react';
import {Fetch}              from 'rex-widget/data';
import * as form from 'rex-widget/form';
import {VBox}               from 'rex-widget/layout';
import Action               from '../Action';
import * as ObjectTemplate  from '../ObjectTemplate';
import * as ContextUtils    from '../ContextUtils';
import * as ui from 'rex-widget/ui';
import Title                from './Title';
import fetchCrossEntity from './fetchCrossEntity';

@Fetch(fetchCrossEntity)
export default class EditCross extends React.Component {

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
    let children;
    if (fetched.entity.updating) {
      children = <ui.Preloader />;
    } else if (fetched.entity.data === null) {
      children = (
        <VBox flex={1} alignItems="center" justifyContent="center">No data</VBox>
      );
    } else {
      children = this.renderForm();
    }
    return (
      <Action
        width={width}
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}>
        {children}
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

    return (
      <form.ConfigurableEntityForm
        ref="form"
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={this.props.dataMutation}
        submitButton={null}
        onSubmitComplete={this._onSubmitComplete.bind(null, context[entity.name])}
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

