/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var invariant           = require('../invariant');
var notifyLayoutChange  = require('./notifyLayoutChange');

var LayoutAwareMixin = {

  componentWillMount() {
    invariant(
      typeof this.onLayoutChange === 'function',
      'Component "%s" which uses LayoutAwareMixin should define onLayoutChange callback',
      this.constructor.displayName
    );
  },

  componentDidMount() {
    window.addEventListener('resize', this.onLayoutChange);
    window.addEventListener(notifyLayoutChange.EVENT_NAME, this.onLayoutChange);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.onLayoutChange);
    window.removeEventListener(notifyLayoutChange.EVENT_NAME, this.onLayoutChange);
  }

};

module.exports = LayoutAwareMixin;
