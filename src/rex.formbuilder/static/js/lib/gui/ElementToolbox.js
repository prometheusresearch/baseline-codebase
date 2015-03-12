/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ElementGroup = require('./ElementGroup');
var {ELEMENT_TYPES} = require('../elements');


var ElementToolbox = React.createClass({
  buildGroups: function () {
    return Object.keys(ELEMENT_TYPES).map((type, idx) => {
      return (
        <ElementGroup
          key={idx}
          type={ELEMENT_TYPES[type]}
          />
      );
    });
  },

  render: function () {
    var groups = this.buildGroups();

    return (
      <div className="rfb-element-toolbox">
        {groups}
      </div>
    );
  }
});


module.exports = ElementToolbox;

