/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import Menu from './menu';
import Demo from './demo/demo';
import Recon from './recon/recon';

function renderMenu(props, element) {
  ReactDOM.render(<Menu {...props} />, element);
}

function renderDemo(props, element) {
  ReactDOM.render(<Demo {...props} />, element);
}

function renderRecon(props, element) {
  ReactDOM.render(<Recon {...props} />, element);
}

global.RexFormsDemo = {
  renderMenu,
  renderDemo,
  renderRecon,
};

