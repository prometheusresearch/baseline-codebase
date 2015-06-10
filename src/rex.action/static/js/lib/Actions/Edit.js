/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var {boxShadow}         = RexWidget.StyleUtils;
var DS                  = RexWidget.DataSpecification;
var ServiceSection      = require('../ServiceSection');
var {VBox, HBox}        = RexWidget.Layout;
var {Forms}             = RexWidget;

var EditStyle = {
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
      <VBox style={{...EditStyle.self, width}}>
        <VBox style={EditStyle.container} size={1}>
          <HBox style={EditStyle.header}>
            <VBox style={EditStyle.title}>
              <h4>
                {title}
              </h4>
            </VBox>
            <RexWidget.Button
              quiet
              icon="remove"
              onClick={onClose}
              />
          </HBox>
          <VBox style={EditStyle.content}>
            {this.data.data.loaded ?
              this.renderForm() :
              <RexWidget.Preloader />}
          </VBox>
        </VBox>
        <VBox style={EditStyle.buttons}>
          <RexWidget.Button
            style={EditStyle.submitButton}
            success
            icon="ok"
            size="small"
            onClick={this.onSubmit}
            align="center">
            Submit
          </RexWidget.Button>
        </VBox>
      </VBox>
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
      icon: 'pencil'
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
