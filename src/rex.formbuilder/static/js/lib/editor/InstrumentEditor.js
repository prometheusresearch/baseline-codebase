/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var ReactForms  = require('react-forms');

var InstrumentEditor = React.createClass({

  render() {
    var {className, instrument, ...props} = this.props;
    return (
      <div {...props} className={cx('rfb-InstrumentEditor', className)}>
        <ReactForms.Element value={instrument.definition} />
      </div>
    );
  }
});

module.exports = InstrumentEditor;
