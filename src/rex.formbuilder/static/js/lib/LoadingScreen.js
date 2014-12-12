/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var Icon        = require('./Icon');
var Button      = require('./Button');
var ButtonGroup = require('./ButtonGroup');

var LoadingScreen = React.createClass({

  propTypes: {
    type: React.PropTypes.oneOf(['white', 'dark']),
    error: React.PropTypes.string
  },

  render() {
    var {type, error} = this.props;
    var className = cx({
      'rfb-LoadingScreen': true,
      'rfb-LoadingScreen--dark': type === 'dark'
    });
    return (
      <div className={className}>
        <div className="rfb-LoadingScreen__text">
          {error ?
            <span className="rfb-LoadingScreen__error">
              {error}
            </span> :
            <span className="rfb-LoadingScreen__loading">
              <Icon name="refresh" animate /> Loading...
            </span>}
        </div>
      </div>
    );
  },

  getDefaultProps() {
    return {
      error: null,
      type: 'white'
    };
  },

});

module.exports = LoadingScreen;
