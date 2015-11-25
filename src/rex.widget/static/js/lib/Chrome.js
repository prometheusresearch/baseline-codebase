/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';

export default class Chrome extends React.Component {

  constructor(props) {
    super(props);
    this._documentTitle = null;
  }

  render() {
    let {content, children, ...props} = this.props;
    return (
      <VBox {...props} title={undefined} height="100%" width="100%" flex={1}>
        {children || content}
      </VBox>
    );
  }

  componentDidMount() {
    this._setDocumentTitle();
  }

  componentDidUpdate() {
    this._setDocumentTitle();
  }

  _setDocumentTitle() {
    let {title} = this.props;
    if (title != null && title !== this._documentTitle) {
      document.title = title;
      this._documentTitle = title;
    }
  }
}
