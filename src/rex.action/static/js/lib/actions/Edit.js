/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React                from 'react';
import RexWidget            from 'rex-widget';
import Action               from '../Action';
import * as ObjectTemplate  from '../ObjectTemplate';
import * as ContextUtils    from '../ContextUtils';
import {getEntityTitle}     from '../Entity';
import Title                from './Title';

let Style = {
  submitButton: {
    width: '25%'
  }
};

let Edit = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  propTypes: {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  },

  dataSpecs: {
    data: RexWidget.DataSpecification.entity(),
    dataMutation: RexWidget.DataSpecification.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {onClose, width} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <Action
        width={width}
        onClose={onClose}
        title={title}
        renderFooter={this.renderFooter}>
        {this.data.data.loaded ?
          this.renderForm() :
          <RexWidget.Preloader />}
      </Action>
    );
  },

  renderFooter() {
    var {submitButton} = this.props;
    return (
      <RexWidget.Button
        style={Style.submitButton}
        success
        icon="ok"
        size="small"
        onClick={this._onSubmit}
        align="center">
        {submitButton}
      </RexWidget.Button>
    );
  },

  renderForm() {
    var {entity, fields, value, context, contextTypes} = this.props;
    value = mergeDeepInto(
      this.data.data.data,
      ObjectTemplate.render(value, context)
    );
    return (
      <RexWidget.Forms.ConfigurableEntityForm
        ref="form"
        context={ContextUtils.getMaskedContext(context, contextTypes.input)}
        submitTo={this.dataSpecs.dataMutation}
        submitButton={null}
        onSubmitComplete={this._onSubmitComplete.bind(null, context[entity.name])}
        initialValue={this.data.data.data}
        value={value}
        entity={entity.type.name}
        fields={fields}
        />
    );
  },

  getDefaultProps() {
    return {
      width: 400,
      icon: 'pencil',
      submitButton: 'Submit'
    };
  },

  _onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  _onSubmitComplete(prevEntity, nextEntity) {
    this.props.onEntityUpdate(prevEntity, nextEntity);
  },

  statics: {

    renderTitle({entity, title = `Edit ${entity.name}`}, context) {
      return <Title title={title} entity={entity} context={context} />;
    },

    getTitle(props) {
      return props.title || `Edit ${props.entity.name}`;
    }

  }
});

export default Edit;

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
