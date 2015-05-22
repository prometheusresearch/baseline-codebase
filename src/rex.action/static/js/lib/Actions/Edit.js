/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
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
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
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
    var {fields, entity} = this.props;
    var port = new RexWidget.Port(entity.path);
    var spec = new RexWidget.DataSpecification.Entity(port);
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...EditStyle.self, width: this.props.width}}>
        <HBox style={EditStyle.header}>
          <VBox style={EditStyle.title}>
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
        <VBox style={EditStyle.content}>
          {this.data.data.loaded ?
            <Forms.ConfigurableForm
              ref="form"
              submitTo={spec}
              submitButton={null}
              value={this.data.data.data}
              entity={entity}
              fields={fields}
              /> : 
            <RexWidget.Preloader />}
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
      return props.title || `Edit ${props.entity}`;
    }
  }
});

module.exports = Edit;


