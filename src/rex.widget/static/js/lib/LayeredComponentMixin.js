/**
 * @jsx React.DOM
 */
'use strict';
var React = require('react');

var LayeredComponentMixin = {

  componentDidMount: function() {
    this._layer = document.createElement('div');
    document.body.appendChild(this._layer);
    this._renderLayer();
  },

  componentDidUpdate: function() {
    this._renderLayer();
  },

  componentWillUnmount: function() {
    this._unrenderLayer();
    document.body.removeChild(this._layer);
  },

  _renderLayer: function() {
    React.renderComponent(this.renderLayer(), this._layer);

    if (this.layerDidMount) {
      this.layerDidMount(this._layer);
    }
  },

  _unrenderLayer: function() {
    if (this.layerWillUnmount) {
      this.layerWillUnmount(this._layer);
    }

    React.unmountComponentAtNode(this._layer);
  }
};

module.exports = LayeredComponentMixin;
