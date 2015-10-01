/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import TimeoutMixin from './TimeoutMixin';

export default {
  ...TimeoutMixin,

  setTimeout(func, ms) {
    this.clearTimeout();
    return TimeoutMixin.setTimeout.call(this, func, ms);
  }
};
