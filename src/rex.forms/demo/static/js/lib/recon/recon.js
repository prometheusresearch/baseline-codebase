/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');

var Toolbar = require('./toolbar');
var Workspace = require('./workspace');


var Recon = React.createClass({
  propTypes: {
    recon: React.PropTypes.object.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    initialLocale: React.PropTypes.string.isRequired,
    availableLocales: React.PropTypes.array.isRequired
  },

  getInitialState: function () {
    return {
      options: {
        locale: this.props.initialLocale
      }
    };
  },

  onChangeOptions: function (options) {
    this.setState({options});
  },

  render: function () {
    return (
      <div className='rfd-Recon'>
        <Toolbar
          mountPoint={this.props.mountPoint}
          onChange={this.onChangeOptions}
          initialLocale={this.props.initialLocale}
          availableLocales={this.props.availableLocales}
          recon={this.props.recon}
          />
        <Workspace
          mountPoint={this.props.mountPoint}
          options={this.state.options}
          recon={this.props.recon}
          />
      </div>
    );
  }
});


module.exports = Recon;

