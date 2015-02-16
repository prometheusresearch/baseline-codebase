/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var ResourceContextTypes = {
  localPrefix: React.PropTypes.string
};


var ResourcerMixin = {
  childContextTypes: ResourceContextTypes,

  getChildContext: function () {
    return {
      localPrefix: this.getLocalResourcePrefix()
    };
  }
};


var ResourcedMixin = {
  contextTypes: ResourceContextTypes,

  getResourceUrl: function (url) {
    if (this.context.localPrefix && (url[0] === '/')) {
      if (this.context.localPrefix[this.context.localPrefix.length - 1] === '/') {
        url = url.slice(1);
      }
      url = this.context.localPrefix + url;
    }

    return url;
  }
};


module.exports = {
  ResourcerMixin,
  ResourcedMixin
};

