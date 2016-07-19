import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import {FormEntry} from '../lib/next';

import instrument from './specs/forms/audio/instrument.json';
import form from './specs/forms/audio/form.json';

let element = document.getElementById('main');

ReactDOM.render(
  <AppContainer>
    <div style={{width: 600, margin: '0 auto'}}>
      <FormEntry
        instrument={instrument}
        form={form}
        />
    </div>
  </AppContainer>,
  element
);

if (module.hot) {
  module.hot.accept('../lib/next', () => {
    // If you use Webpack 2 in ES modules mode, you can
    // use <App /> here rather than require() a <NextApp />.
    let FormEntry = require('../lib/next').FormEntry;
    ReactDOM.render(
      <AppContainer>
        <div style={{width: 600, margin: '0 auto'}}>
          <FormEntry instrument={instrument} form={form} />
        </div>
      </AppContainer>,
      element
    );
  });
} 
