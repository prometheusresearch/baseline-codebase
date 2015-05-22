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
    var {fields, entity} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...EditStyle.self, width: this.props.width}}>
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
              onClick={this.props.onClose}
              />
          </HBox>
          <VBox style={EditStyle.content}>
            {this.data.data.loaded ?
              <Forms.ConfigurableForm
                ref="form"
                submitTo={this.dataSpecs.data}
                submitButton={null}
                value={this.data.data.data}
                entity={entity}
                fields={fields}
                /> :
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


