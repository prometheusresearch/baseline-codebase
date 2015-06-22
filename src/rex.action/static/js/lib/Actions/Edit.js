/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var {boxShadow}         = RexWidget.StyleUtils;
var DS                  = RexWidget.DataSpecification;
var Action              = require('../Action');
var {VBox, HBox}        = RexWidget.Layout;
var {Forms}             = RexWidget;

var Style = {
  submitButton: {
    width: '25%'
  }
};

var Edit = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  dataSpecs: {
    data: DS.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {onClose, width} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <Action width={width} onClose={onClose} title={title} renderFooter={this.renderFooter}>
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
        onClick={this.onSubmit}
        align="center">
        {submitButton}
      </RexWidget.Button>
    );
  },

  renderForm() {
    var {entity, fields, value, context} = this.props;
    value = mergeDeepInto(this.data.data.data, buildValue(value, context));
    return (
      <Forms.ConfigurableEntityForm
        ref="form"
        submitTo={this.dataSpecs.data}
        submitButton={null}
        initialValue={this.data.data.data}
        value={value}
        entity={entity.type}
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

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    this.refs.form.submit();
  },

  statics: {
    getTitle(props) {
      return props.title || `Edit ${props.entity.name}`;
    }
  }
});

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

module.exports = Edit;
