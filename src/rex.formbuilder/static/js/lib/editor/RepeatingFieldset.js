/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React                 = require('react');
var BaseRepeatingFieldset = require('../RepeatingFieldset');
var emptyFunction         = require('../emptyFunction');
var Actions               = require('./Actions');

var RepeatingFieldset = React.createClass({

  render() {
    return <BaseRepeatingFieldset {...this.props} onAdd={this.onAdd} />;
  },

  getDefaultProps() {
    return {onAdd: emptyFunction};
  },

  onAdd(newValue, newNode, newIdx, value) {
    if (newNode.props.get('transactionalFieldset')) {
      Actions.transactionStarted(value.keyPath.concat(newIdx));
    }
    this.props.onAdd(newValue, newNode, newIdx, value);
  }

});

module.exports = RepeatingFieldset;
