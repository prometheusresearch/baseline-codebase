/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('./RepeatingFieldset');

var ChannelPageList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        shouldRenderRemoveButton={this.shouldRenderRemoveButton}
        className={cx("rfb-ChannelPageList", className)}
        buttonCaption="Add new page"
        />
    );
  },

  shouldRenderRemoveButton({value}) {
    return value.get('elements').size === 0;
  }
});

module.exports = ChannelPageList;
