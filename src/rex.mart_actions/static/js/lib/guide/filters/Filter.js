/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import {VBox} from 'react-stylesheet';


export default class Filter extends React.Component {
  render() {
    let {title, children} = this.props;

    return (
      <VBox>
        <p>{title}</p>
        {children}
      </VBox>
    );
  }
}

