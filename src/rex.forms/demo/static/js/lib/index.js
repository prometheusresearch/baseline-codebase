/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var Menu = require('./menu');
var Demo = require('./demo');


function renderMenu(props, element) {
  React.renderComponent(Menu(props), element);
}

function renderDemo(props, element) {
  React.renderComponent(Demo(props), element);
}


global.RexFormsDemo = module.exports = {
  renderMenu,
  renderDemo
};

