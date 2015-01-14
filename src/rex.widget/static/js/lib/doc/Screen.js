/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var Sidebar       = require('./Sidebar');
var Widget        = require('./Widget');
var Placeholder   = require('./Placeholder');

var Screen = React.createClass({

  style: {
    overflow: 'hidden'
  },

  render() {
    var {selectedWidget} = this.state;
    var {widgets, ...props} = this.props;
    return (
      <HBox {...props} style={this.style} width="100%" height="100%">
        <Sidebar
          size={1}
          selectedWidget={selectedWidget}
          widgets={widgets}
          onSelect={this.onWidgetSelect}
          />
        <VBox size={4}>
          {selectedWidget === null && <Placeholder />}
          {selectedWidget !== null && <Widget widget={selectedWidget} />}
        </VBox>
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      size: 1
    };
  },

  getInitialState() {
    return {
      selectedWidget: this.props.widgets[3]
    };
  },

  onWidgetSelect(selectedWidget) {
    this.setState({selectedWidget});
  }
});

module.exports = Screen;
