/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var {VBox, HBox}        = RexWidget.Layout;
var DS                  = RexWidget.DataSpecification;

var ViewStyle = {
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

var View = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: DS.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {fields, entity, context, onClose} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...ViewStyle.self, width: this.props.width}}>
        <HBox style={ViewStyle.header}>
          <VBox style={ViewStyle.title}>
            <h4>{title}</h4>
          </VBox>
          <RexWidget.Button
            quiet
            icon="remove"
            onClick={onClose}
            />
        </HBox>
        <VBox style={ViewStyle.content}>
          <RexWidget.Info
            data={this.data.data}
            fields={fields}
            />
        </VBox>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      icon: 'eye-open',
      width: 400
    };
  },

  statics: {
    getTitle(props) {
      return props.title || `View ${props.entity}`;
    }
  }
});

module.exports = View;

