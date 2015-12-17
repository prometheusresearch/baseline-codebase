/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React  from 'react';
import Action from '../Action';

export default class Page extends React.Component {

  static defaultProps = {
    width: 480,
    title: 'Page',
    icon: 'file'
  }

  render() {
    let {width, title, text, onClose} = this.props;
    return (
      <Action title={title} onClose={onClose} width={width}>
        <div dangerouslySetInnerHTML={{__html: text}} />
      </Action>
    );
  }
}
