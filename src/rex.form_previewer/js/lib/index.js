/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';

import {Provider} from 'rex-i18n';

import FormPreviewer from './FormPreviewer';

import './index.css';


function makeRenderWrapper(Component) {
  return function (options) {
    let element = options.element;
    delete options.element;

    return ReactDOM.render(
      <Provider
        locale={options.locale}
        baseUrl={options.i18nBaseUrl}>
        <Component {...options} />
      </Provider>,
      element
    );
  };
}


var renderForm = makeRenderWrapper(FormPreviewer);


module.exports = {
  renderForm: renderForm
};

global.Rex = global.Rex || {};
global.Rex.FormPreviewer = module.exports;

