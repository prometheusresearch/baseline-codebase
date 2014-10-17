/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var {Element} = require('react-forms');

var BoundsConstraint= React.createClass({

  propTypes: {
    label: React.PropTypes.string
  },

  render() {
    var {label, value} = this.props;
    return (
      <div className="rfb-BoundConstraint">
        <label className="rf-Label rf-Field__label">{label}</label>
        <div className="rfb-two-fields-row">
          <Element value={value.child('min')} />
          <Element value={value.child('max')} />
        </div>
      </div>
    );
  }
});


module.exports = BoundsConstraint;
