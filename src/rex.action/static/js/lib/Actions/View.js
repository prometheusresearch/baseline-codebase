/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget/lib/modern');
var {VBox, HBox}        = RexWidget.Layout;
var DS                  = RexWidget.DataSpecification;

var ShowInfo = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    dataSpec: DS.entity({
      '*': DS.prop('entity', {required: true})
    })
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    return (
      <VBox>
        <RexWidget.Info data={this.data.dataSpec} />
      </VBox>
    );
  }
});

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

  render() {
    var port = new RexWidget.Port(this.props.data.path);
    var dataSpec = new DS.Entity(port);
    return (
      <VBox style={ViewStyle.self}>
        <HBox style={ViewStyle.header}>
          <VBox style={ViewStyle.title}>
            <h4>
              {this.props.activityName}
            </h4>
          </VBox>
          <RexWidget.Button
            quiet
            icon="remove"
            onClick={this.props.onClose}
            />
        </HBox>
        <VBox style={ViewStyle.content}>
          <ShowInfo
            dataSpec={dataSpec}
            entity={this.props.context[this.props.data.entity]}
            />
        </VBox>
      </VBox>
    );
  }
});

module.exports = View;

