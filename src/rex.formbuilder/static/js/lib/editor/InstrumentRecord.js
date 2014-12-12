/**
 * @jsx React.DOM
 */
'use strict';

var React                 = require('react/addons');
var cx                    = React.addons.classSet;
var TransactionalFieldset = require('./TransactionalFieldset');

var InstrumentRecord = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <div {...props} className={cx("rfb-InstrumentRecord", className)}>
        <TransactionalFieldset value={value} />
      </div>
    );
  }
});

module.exports = InstrumentRecord;
