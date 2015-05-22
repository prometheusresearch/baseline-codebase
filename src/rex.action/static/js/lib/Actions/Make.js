/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var ServiceSection      = require('../ServiceSection');
var {VBox, HBox}        = RexWidget.Layout;
var {Forms}             = RexWidget;

var MakeStyle = {
  self: {
    flex: 1,
  },
  title: {
    flex: 1
  },
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
  }
};

function buildValue(spec, context) {
  var value = {};
  for (var key in spec) {
    var item = spec[key];
    if (item[0] === '$') {
      value[key] = context[key];
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

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  render() {
    var {fields, entity} = this.props;
    var port = new RexWidget.Port(entity.path);
    var spec = new RexWidget.DataSpecification.Entity(port);
    var value = {};
    value[entity.entity] = [buildValue(this.props.value, this.props.context)];
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={MakeStyle.self}>
        <HBox style={MakeStyle.header}>
          <VBox style={MakeStyle.title}>
            <h4>
              {title}
            </h4>
          </VBox>
          <RexWidget.Button
            quiet
            icon="remove"
            onClick={this.props.onClose}
            />
        </HBox>
        <VBox style={MakeStyle.content}>
          <Forms.ConfigurableForm
            insert
            ref="form"
            entity={entity}
            fields={fields}
            submitTo={spec}
            submitButton={null}
            value={value}
            />
        </VBox>
      </VBox>
    );
  },

  renderService(actions) {
    var style = {marginBottom: 10, width: '30%'};
    return [
      <ServiceSection title="Form">
        <RexWidget.Button
          style={style}
          success
          icon={this.props.icon}
          onClick={this.onSubmit}
          align="left">
          {this.props.title}
        </RexWidget.Button>
        <RexWidget.Button
          style={style}
          quiet
          icon="remove"
          onClick={this.props.onClose}
          align="left">
          Cancel
        </RexWidget.Button>
      </ServiceSection>,
      actions
    ];
  },

  getDefaultProps() {
    return {
      width: 400,
      icon: 'plus'
    };
  },

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  statics: {
    getTitle(props) {
      return props.title || `Make ${props.entity}`;
    }
  }
});

module.exports = Make;

