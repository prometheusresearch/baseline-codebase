/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import ScrollablePanel from './ScrollablePanel';


export default class HelpPanel extends React.Component {
  render() {
    let {text} = this.props;

    return (
      <ScrollablePanel>
        <div dangerouslySetInnerHTML={{__html: text}} />
      </ScrollablePanel>
    );
  }
}

