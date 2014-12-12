/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var TransactionalFieldset = require('./TransactionalFieldset');

var ChannelPage = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <div {...props} className={cx("rfb-ChannelPage", className)}>
        <TransactionalFieldset value={value} />
      </div>
    );
  }
});

module.exports = ChannelPage;
