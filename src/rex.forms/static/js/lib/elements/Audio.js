/**
 * @jsx React.DOM
 */

'use strict';

var React        = require('react');
var cx           = React.addons.classSet;
var ElementMixin = require('./ElementMixin');
var AudioPlayer  = require('../AudioPlayer');


var AudioElement = React.createClass({
  mixins: [
    ElementMixin
  ],

  render: function () {
    var classes = this.getBaseClasses();
    classes['rex-forms-Audio'] = true;
    classes = cx(classes);

    return (
      <div className={classes}>
        <AudioPlayer
          source={this.props.options.source}
          />
      </div>
    );
  }
});


module.exports = AudioElement;

