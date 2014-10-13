/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var cx           = React.addons.classSet;
var ElementMixin = require('./ElementMixin');
var localized    = require('../localized');

var Text = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    var classes = this.getBaseClasses();
    classes['rex-forms-Text'] = true;
    classes = cx(classes);

    return (
      <div className={classes}>
        <localized
          block
          component={React.DOM.div}>
          {this.props.options.text}
        </localized>
      </div>
    );
  }
});

module.exports = Text;
