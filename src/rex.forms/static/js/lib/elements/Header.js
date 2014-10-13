/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var cx           = React.addons.classSet;
var ElementMixin = require('./ElementMixin');
var localized    = require('../localized');

var Header = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    var classes = this.getBaseClasses();
    classes['rex-forms-Header'] = true;
    classes = cx(classes);

    return (
      <div className={classes}>
        <localized
          block={false}
          component={React.DOM.h2}>
          {this.props.options.text}
        </localized>
      </div>
    );
  }
});

module.exports = Header;
