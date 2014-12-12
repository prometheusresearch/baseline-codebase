/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var ReactForms  = require('react-forms');

var Instrument = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <div {...props} className={cx("rfb-Instrument", className)}>
        <ReactForms.Element
          className="rfb-Instrument__title"
          value={value.get('title')}
          />
        <ReactForms.Element
          className="rfb-Instrument__record"
          value={value.get('record')}
          />
      </div>
    );
  }
});

module.exports = Instrument;
