/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';

import {InjectI18N} from 'rex-i18n';
import * as Stylesheet from 'rex-widget/stylesheet';

import Error from './Error';


@InjectI18N
export default class EntryError extends React.Component {
  static stylesheet = Stylesheet.create({
    Root: {
      Component: Error,
    },
  });

  static propTypes = {
    errorCode: React.PropTypes.string.isRequired
  };

  render() {
    let {Root} = this.constructor.stylesheet;

    let message;
    if (this.props.errorCode == 'TASK_NOT_FOUND') {
      message = this._('The selected Task could not be retrieved.');
    } else if (this.props.errorCode === 'CHANNEL_NOT_FOUND') {
      message = this._('The configured Channel could not be retrieved.');
    } else if (this.props.errorCode === 'ENTRY_NOT_FOUND') {
      message = this._('The selected Entry could not be retrieved.');
    } else if (this.props.errorCode === 'CANNOT_START_ENTRY') {
      message = this._('The Task is not in a state that allows creation of a new Entry.');
    } else if (this.props.errorCode === 'FORM_NOT_FOUND') {
      message = this._('There are no Forms configured in the system that can display the selected Task.');
    } else {
      message = this._('An unexpected error has occurred.');
    }

    return <Root message={message} />;
  }
}

