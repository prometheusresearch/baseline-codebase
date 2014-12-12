/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('./RepeatingFieldset');

var InstrumentRecordList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        onAdd={this.onAdd}
        onRemove={this.onRemove}
        className={cx("rfb-InstrumentRecordList", className)}
        buttonCaption="Add new field"
        />
    );
  },

  onAdd(idx) {
    console.log('onAdd', idx);
  },

  onRemove(idx) {
    console.log('onRemove', idx);
  }
});

module.exports = InstrumentRecordList;
