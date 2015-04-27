/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget/lib/modern');
var ServiceSection      = require('../ServiceSection');
var {VBox, HBox}        = RexWidget.Layout;
var {Forms}             = RexWidget;

var CreateStyle = {
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

var Create = React.createClass({

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
    return (
      <VBox style={CreateStyle.self}>
        <HBox style={CreateStyle.header}>
          <VBox style={CreateStyle.title}>
            <h4>
              {this.props.title}
            </h4>
          </VBox>
          <RexWidget.Button
            quiet
            icon="remove"
            onClick={this.props.onClose}
            />
        </HBox>
        <VBox style={CreateStyle.content}>
          <Forms.Form
            insert
            ref="form"
            submitTo={spec}
            submitButton={null}
            value={value}>
            {fields.map(this.renderField)}
          </Forms.Form>
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

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  renderField(field) {
    var selectFormValue = [this.props.entity.entity, 0].concat(field.key);
    var key = selectFormValue.join('.');
    switch (field.type) {
      case 'file':
        return (
          <Forms.FileUploadField
            key={key}
            selectFormValue={selectFormValue}
            storage={field.storage}
            download={field.download}
            label={field.name}
            />
        );
      case 'date':
        return (
          <Forms.Field
            key={key}
            selectFormValue={selectFormValue}
            label={field.name}
            />
        );
      case 'string':
      default:
        return (
          <Forms.Field
            key={key}
            selectFormValue={selectFormValue}
            label={field.name}
            />
        );
    }
  }
});

module.exports = Create;

