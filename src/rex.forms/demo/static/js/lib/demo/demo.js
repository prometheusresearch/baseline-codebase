/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');

var Toolbar = require('./toolbar');
var Workspace = require('./workspace');


var Demo = React.createClass({
  propTypes: {
    demo: React.PropTypes.object.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    lookupApiUrl: React.PropTypes.string.isRequired,
    initialLocale: React.PropTypes.string.isRequired,
    availableLocales: React.PropTypes.array.isRequired
  },

  getInitialState: function () {
    return {
      options: {}
    };
  },

  onChangeOptions: function (options) {
    this.setState({options});
  },

  render: function () {
    return (
      <div className='rfd-Demo'>
        <Toolbar
          mountPoint={this.props.mountPoint}
          onChange={this.onChangeOptions}
          initialLocale={this.props.initialLocale}
          availableLocales={this.props.availableLocales}
          demo={this.props.demo}
          />
        <Workspace
          mountPoint={this.props.mountPoint}
          lookupApiUrl={this.props.lookupApiUrl}
          options={this.state.options}
          demo={this.props.demo}
          />
      </div>
    );
  }
});


module.exports = Demo;

