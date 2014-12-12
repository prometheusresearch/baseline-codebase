/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('../RepeatingFieldset');

var EventList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        className={cx("rfb-EventList", className)}
        buttonCaption="Add new event"
        />
    );
  }
});

module.exports = EventList;
