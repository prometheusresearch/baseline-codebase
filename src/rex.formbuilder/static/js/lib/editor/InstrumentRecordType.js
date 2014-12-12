/**
 */
'use strict';

var React = require('react/addons');
var cx = React.addons.classSet;
var ReactForms = require('react-forms');
var isString = require('../isString');

var InstrumentRecordType = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <div {...props} className={cx('rfb-InstrumentRecord', className)}>
        <ReactForms.Fieldset value={value} />
      </div>
    );
  }
});

module.exports = InstrumentRecordType;
