/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React                from 'react';
import RexWidget            from 'rex-widget';
import emptyFunction        from 'rex-widget/lib/emptyFunction';
import {command, Types}     from '../ActionCommand';
import Action               from '../Action';
import * as ObjectTemplate  from '../ObjectTemplate';
import * as ContextUtils    from '../ContextUtils';

let Style = {
  submitButton: {
    width: '25%'
  }
};

let Make = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: RexWidget.DataSpecification.entity(),
    dataQuery: RexWidget.DataSpecification.entity()
  },

  propTypes: {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  },

  render() {
    var {
      useQuery, fields, entity,
      submitButton, onClose, width, context, contextTypes
    } = this.props;
    var value = ObjectTemplate.render(this.props.value, context);
    var title = this.constructor.getTitle(this.props);
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
          submitTo={useQuery ? this.dataSpecs.dataQuery : this.dataSpecs.data}
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
      icon: 'plus',
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
    if (this.props.useQuery) {
      let params = this.dataSpecs.data.produceParams().toJS();
      params['*'] = data.id;
      this.dataSpecs.data.port.produceEntity(params).then(data => this._onSubmitComplete(data));
    } else {
      this._onSubmitComplete(data);
    }
  },

  _onSubmitComplete(data) {
    this.props.onSubmitComplete(data);
    var key = this.state.key + 1;
    this.setState({key});
    this.props.onCommand('default', data);
  },

  statics: {
    getTitle(props) {
      return props.title || `Make ${props.entity.name}`;
    },

    commands: {

      @command(Types.ConfigurableEntity())
      default(props, context, entity) {
        return {...context, [props.entity.name]: entity};
      }
    }
  }
});

export default Make;
