/**
 * @jsx React.DOM
 */
'use strict';

var React            = require('react/addons');
var cx               = React.addons.classSet;
var LoadingIndicator = require('./LoadingIndicator');

var Preloader = React.createClass({

  render() {
    return (
      <div className={cx("rex-widget-Preloader", this.props.className)}>
        <LoadingIndicator /> 
        {this.props.caption &&
          <div className="rex-widget-Preloader__caption">
            {this.props.caption}
          </div>}
      </div>
    );
  },

  getDefaultProps() {
    return {caption: null};
  }
});

module.exports = Preloader;
