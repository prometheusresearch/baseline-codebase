/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

export default {

  componentDidMount() {
    this._layer = document.createElement('div');
    this._layer.style.height = '0px';
    this._layer.style.width = '0px';
    document.body.appendChild(this._layer);
    this._renderLayer();
  },

  componentDidUpdate() {
    this._renderLayer();
  },

  componentWillUnmount() {
    this._unrenderLayer();
    document.body.removeChild(this._layer);
  },

  _renderLayer() {
    React.render(this.renderLayer(), this._layer);

    if (this.layerDidMount) {
      this.layerDidMount(this._layer);
    }
  },

  _unrenderLayer() {
    if (this.layerWillUnmount) {
      this.layerWillUnmount(this._layer);
    }

    React.unmountComponentAtNode(this._layer);
  }
};
