/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');

var Toolbox = require('./Toolbox');
var ElementTool = require('./ElementTool').default;
var {ELEMENT_TYPES, Element} = require('../elements');
var _ = require('../i18n').gettext;


var ElementToolbox = ReactCreateClass({
  render: function () {
    var groups = [
      {
        id: ELEMENT_TYPES.TYPE_QUESTION,
        label: _('Questions')
      },
      {
        id: ELEMENT_TYPES.TYPE_CONTENT,
        label: _('Page Content')
      }
    ];

    return (
      <Toolbox
        groups={groups}
        tools={Element.getRegisteredElements()}
        toolComponent={ElementTool}
        />
    );
  }
});


module.exports = ElementToolbox;

