/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var DS                  = RexWidget.DataSpecification;
var {VBox, HBox}        = RexWidget.Layout;
var ServiceSection      = require('../ServiceSection');

var PickStyle = {
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

var Pick = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  dataSpecs: {
    data: DS.collection()
  },

  render() {
    var {entity, onClose} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...PickStyle.self, width: this.props.width}}>
        <HBox style={PickStyle.header}>
          <VBox style={PickStyle.title}>
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
        <RexWidget.DataTable
          sortable={this.props.sortable}
          resizableColumns={this.props.resizableColumns}
          dataSpec={this.dataSpecs.data}
          columns={this.props.columns}
          selectable
          selected={this.state.selected}
          onSelected={this.onSelected}
          />
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      icon: 'list',
      width: 600
    };
  },

  getInitialState() {
    return {
      selected: null,
      data: null
    };
  },

  onSelected(selected, data) {
    this.setState({selected, data});
    var nextContext = {...this.props.context};
    nextContext[this.props.entity] = selected;
    this.props.onContext(nextContext);
  },

  statics: {
    getTitle(props) {
      return props.title || `Pick ${props.entity}`;
    }
  }
});

module.exports = Pick;
