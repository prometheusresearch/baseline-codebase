import React from 'react';

export default class DBGUI extends React.Component {
  static childContextTypes = {
    baseUrl: React.PropTypes.string
  };

  getChildContext() {
    let {baseUrl} = this.props;
    if (/\/$/.test(baseUrl)) {
      baseUrl = baseUrl.substr(0, baseUrl.length - 1);
    }
    return {baseUrl};
  }

  render() {
    return this.props.wizard;
  }
}
