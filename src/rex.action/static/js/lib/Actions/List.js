/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget/lib/modern');
var DS                  = RexWidget.DataSpecification;
var {VBox, HBox}        = RexWidget.Layout;
var ServiceSection      = require('../ServiceSection');

var ListStyle = {
  self: {
    flex: 1
  },
  header: {
    padding: 10
  },
  title: {
    flex: 1
  }
};

var List = React.createClass({

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  render() {
    var port = new RexWidget.Port(this.props.data.path);
    var bindings = this._compileBindings();
    var dataSpec = new RexWidget.DataSpecification.Collection(port, bindings);
    dataSpec = dataSpec.bindToContext(this);
    console.log('DS', dataSpec);
    return (
      <VBox style={{...ListStyle.self, width: this.props.width}}>
        <HBox style={ListStyle.header}>
          <VBox style={ListStyle.title}>
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
        <RexWidget.DataTable
          sortable={this.props.sortable}
          resizableColumns={this.props.resizableColumns}
          dataSpec={dataSpec}
          columns={this.props.columns}
          selectable
          selected={this.state.selected}
          onSelected={this.onSelected}
          />
      </VBox>
    );
  },

  renderService(actions) {
    if (this.state.selected === null || !this.props.fields) {
      return actions;
    } else {
      var data = new RexWidget.DataSet(this.state.data, false, null);
      return [
        <ServiceSection title={`Selected ${this.props.data.entity}`}>
          <RexWidget.Info
            data={data}
            fields={this.props.fields.map(f => ({valueKey: f.key, label: f.name}))}
            />
        </ServiceSection>,
        actions
      ];
    }
  },

  getDefaultProps() {
    return {
      width: 600
    };
  },

  getInitialState() {
    return {
      selected: null,
      data: null
    };
  },

  _compileBindings() {
    var bindings = this.props.data.bindings;
    if (!bindings) {
      return {};
    }
    var nextBindings = {};
    for (var k in bindings) {
      nextBindings[k] = DS.prop(`context.${bindings[k]}`, {required: true})
    }
    return nextBindings;
  },

  onSelected(selected, data) {
    this.setState({selected, data});
    var nextContext = {...this.props.context};
    nextContext[this.props.data.entity] = selected;
    this.props.onContext(nextContext);
  }
});

module.exports = List;
