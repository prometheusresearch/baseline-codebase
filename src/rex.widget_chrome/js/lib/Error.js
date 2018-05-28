/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React from 'react';

export default class Error extends React.Component {

  render() {
    let {code, title, explanation, url} = this.props;
    return (
      <div style={{padding: '10px'}}>
        <h1>{code} {title}</h1>
        <p style={{fontSize: '90%', fontWeight: 'bold'}}>{url}</p>
        <p style={{marginTop: 10, whiteSpace: 'pre'}}>{explanation}</p>
      </div>
    );
  }

}
