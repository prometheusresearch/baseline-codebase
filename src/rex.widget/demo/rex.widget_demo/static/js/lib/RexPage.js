/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var cloneWithProps  = require('react/lib/cloneWithProps');
var Page            = require('rex-widget/lib/Page');

var RexPage = React.createClass({

  render() {
    var {sitemap, navigation, id: active} = this.props;
    return this.transferPropsTo(
      <Page className="rw-RexPage">
        {navigation && cloneWithProps(navigation, {sitemap, active})}
        <div className="rw-RexPage__content">
          {this.props.children}
        </div>
      </Page>
    );
  },

  componentDidMount() {
    document.title = this.props.title;
  }
});

module.exports = RexPage;

