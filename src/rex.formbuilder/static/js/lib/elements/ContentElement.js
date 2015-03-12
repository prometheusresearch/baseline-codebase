/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

/*eslint no-unused-vars:0 */
var React = require('react');

var Element = require('./Element');
var ELEMENT_TYPES = require('./types');


class ContentElement extends Element {
  static getType() {
    return ELEMENT_TYPES.TYPE_CONTENT;
  }

  getWorkspaceComponent() {
    return (
      <div className='rfb-workspace-element-details'>
        {this.constructor.ICON_NAME &&
          <div className='rfb-workspace-element-icon'>
            {this.constructor.getIconComponent()}
          </div>
        }
        <div className='rfb-workspace-element-description'>
          {this.constructor.getName()}
        </div>
      </div>
    );
  }
}


module.exports = ContentElement;

