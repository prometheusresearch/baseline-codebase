/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var emptyFunction       = require('rex-widget/lib/emptyFunction');
var ServiceSection      = require('../ServiceSection');
var {boxShadow}         = RexWidget.StyleUtils;
var {VBox, HBox}        = RexWidget.Layout;
var DS                  = RexWidget.DataSpecification;
var {Forms}             = RexWidget;

var Style = {
  self: {
    flex: 1,
  },
  title: {
    flex: 1
  },
  container: {
    overflow: 'auto'
  },
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
  },
  buttons: {
    boxShadow: boxShadow(0, 0, 2, 0, '#cccccc'),
    padding: 5
  },
  submitButton: {
    width: '25%'
  }
};

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
    var {fields, entity, submitButton, onClose} = this.props;
    var value = buildValue(this.props.value, this.props.context);
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...Style.self, width: this.props.width}}>
        <VBox style={Style.container} size={1}>
          <HBox style={Style.header}>
            <VBox style={Style.title}>
              <h4>
                {title}
              </h4>
            </VBox>
            {onClose &&
              <RexWidget.Button
                quiet
                icon="remove"
                onClick={onClose}
                />}
          </HBox>
          <VBox style={Style.content}>
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
          </VBox>
        </VBox>
        <VBox style={Style.buttons}>
          <RexWidget.Button
            style={Style.submitButton}
            success
            icon={this.props.icon}
            size="small"
            onClick={this.onSubmit}
            align="center">
            {submitButton}
          </RexWidget.Button>
        </VBox>
      </VBox>
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

module.exports = Make;

