/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var cx              = React.addons.classSet;
var PropTypes       = React.PropTypes;
var Icon            = require('../Icon');
var merge           = require('../merge');
var PageStateMixin  = require('../PageStateMixin');
var ResizeableBlock = require('./ResizeableBlock');

var CollapsibleBlock = React.createClass({

  mixins: [PageStateMixin],

  render() {
    var className = cx({
      'rex-widget-CollapsibleBlock': true,
      'rex-widget-CollapsibleBlock--collapsed': this.state.collapsed,
      'rex-widget-CollapsibleBlock--vertical': this.props.vertical
    });
    var service = (
      <div onClick={this.toggle} className="rex-widget-CollapsibleBlock__button">
        <div className="rex-widget-CollapsibleBlock__buttonInner">
          {this.state.collapsed ?
            <Icon name="chevron-up" /> :
            <Icon name="chevron-down" />}
        </div>
      </div>
    );
    return this.transferPropsTo(
      <ResizeableBlock
        service={service}
        className={className}
        forceSize={this.state.collapsed ? 0 : undefined}>
        {this.props.children}
      </ResizeableBlock>
    );
  },

  getInitialState() {
    return merge({collapsed: false}, this.getPageState());
  },

  toggle() {
    var collapsed = !this.state.collapsed;
    this.setState({collapsed});
    this.setPageState({collapsed});
  }
});

module.exports = CollapsibleBlock;
