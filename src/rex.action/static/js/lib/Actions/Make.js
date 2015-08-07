/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React          from 'react';
import RexWidget      from 'rex-widget';
import emptyFunction  from 'rex-widget/lib/emptyFunction';
import Action         from '../Action';
import buildValue     from '../buildValueFromContext';

let Style = {
  submitButton: {
    width: '25%'
  }
};

let Make = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: RexWidget.DataSpecification.entity()
  },

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  render() {
    var {fields, entity, submitButton, onClose, width} = this.props;
    var value = buildValue(this.props.value, this.props.context);
    var title = this.constructor.getTitle(this.props);
    return (
      <Action title={title} width={width} onClose={onClose} renderFooter={this.renderFooter}>
        <RexWidget.Forms.ConfigurableEntityForm
          insert
          key={this.getKey()}
          ref="form"
          entity={entity.type.name}
          fields={fields}
          submitTo={this.dataSpecs.data}
          submitButton={null}
          onSubmitComplete={this.onSubmitComplete}
          value={value}
          />
      </Action>
    );
  },

  renderFooter() {
    var {submitButton, icon} = this.props;
    return (
      <RexWidget.Button
        onClick={this.onSubmit}
        style={Style.submitButton}
        success
        icon={icon}
        size="small"
        align="center">
        {submitButton}
      </RexWidget.Button>
    );
  },

  getInitialState() {
    return {key: 1};
  },

  getDefaultProps() {
    return {
      width: 400,
      icon: 'ok',
      onSubmitComplete: emptyFunction,
      submitButton: 'Submit'
    };
  },

  getKey() {
    var contextKey = Object
      .keys(this.props.contextTypes.input)
      .map(k => this.props.context[k])
      .join('__');
    return `${contextKey}__${this.state.key}`;
  },

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  onSubmitComplete(data) {
    this.props.onSubmitComplete(data);

    var key = this.state.key + 1;
    this.setState({key});

    var nextContext = {...this.props.context};
    nextContext[this.props.entity.name] = data;
    this.props.onContext(nextContext);
  },

  statics: {
    getTitle(props) {
      return props.title || `Make ${props.entity.name}`;
    }
  }
});

export default Make;
