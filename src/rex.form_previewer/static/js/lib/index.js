/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var $ = require('jquery');
global.jQuery = global.$ = $;
var React = require('react/addons');

var RexI18N = require('rex-i18n');
var FormPreviewer = require('./FormPreviewer');


function makeRenderWrapper(component) {
  return function (options) {
    var element = options.element;
    delete options.element;

    var comp = React.renderComponent(
      component(options),
      element
    );

    RexI18N.onLoad(options.locale || 'en', function () {
      comp.forceUpdate();
    });
  };
}


var renderForm = makeRenderWrapper(FormPreviewer);


module.exports = {
  renderForm: renderForm
};

global.Rex = global.Rex || {};
global.Rex.FormPreviewer = module.exports;

