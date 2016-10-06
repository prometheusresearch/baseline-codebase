import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import * as qs from 'qs';
import QueryBuilderApp from './QueryBuilderApp';


let params = qs.parse(window.location.search.substr(1));


ReactDOM.render(
  <QueryBuilderApp api={params.api} />,
  document.getElementById('root')
);

