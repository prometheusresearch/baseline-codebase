/**
 * @flow
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React = require('react');
var PropTypes       = require('prop-types');
var ReactCreateClass = require('create-react-class');
var cx = require('classnames');

var Message = ReactCreateClass({

  propTypes: {
    className: PropTypes.string
  },

  render(): ?ReactElement {
    var {className, ...props} = this.props;
    return (
      <span {...props} className={cx('rf-Message', className)}>
        {this.props.children}
      </span>
    );
  }
});

module.exports = Message;
