/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var emptyFunction       = require('rex-widget/lib/emptyFunction');
var Action              = require('../Action');
var {boxShadow}         = RexWidget.StyleUtils;
var {VBox, HBox}        = RexWidget.Layout;
var DS                  = RexWidget.DataSpecification;
var {Forms}             = RexWidget;

var Style = {
  submitButton: {
    width: '25%'
  }
};

var Make = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: DS.entity()
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
        <Forms.ConfigurableEntityForm
          insert
          key={this.getKey()}
          ref="form"
          entity={entity.type}
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
      .keys(this.props.contextSpec.input)
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
    nextContext[this.props.entity.name] = data.id;
    this.props.onContext(nextContext);
  },

  statics: {
    getTitle(props) {
      return props.title || `Make ${props.entity.name}`;
    }
  }
});

function buildValue(spec, context) {
  var value = {};
  for (var key in spec) {
    var item = spec[key];
    if (item[0] === '$') {
      value[key] = context[item.substr(1)];
    } else {
      value[key] = item;
    }
    if (typeof value[key] === 'object') {
      value[key] = buildValue(value[key], context);
    }
  }
  return value;
}

module.exports = Make;

