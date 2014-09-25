/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var cloneWithProps  = require('react/lib/cloneWithProps');
var BasePage        = require('../Page');
var Navigation      = require('./Navigation');

var Page = React.createClass({

  render() {
    var {
      applicationName,
      sitemap,
      navigation,
      applets,
      id: active
    } = this.props;
    return this.transferPropsTo(
      <BasePage className="rw-Page">
        {navigation &&
          <Navigation
            sitemap={sitemap}
            applets={applets}
            active={active}
            applicationName={applicationName}
            />}
        <div className="rw-RexPage__content">
          {this.props.children}
        </div>
      </BasePage>
    );
  },

  componentDidMount() {
    document.title = this.props.title;
  }
});

module.exports = Page;

