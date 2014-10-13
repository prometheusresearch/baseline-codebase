/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var cx           = React.addons.classSet;
var ElementMixin = require('./ElementMixin');

var Divider = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    var classes = this.getBaseClasses();
    classes['rex-forms-Divider'] = true;
    classes = cx(classes);

    return (
      <div className={classes}>
        <hr />
      </div>
    );
  }
});

module.exports = Divider;
