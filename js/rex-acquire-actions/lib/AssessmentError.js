/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';
import PropTypes from 'prop-types';

import {InjectI18N} from 'rex-i18n';
import * as Stylesheet from 'rex-widget/Stylesheet';

import Error from './Error';


export default InjectI18N(class AssessmentError extends React.Component {
  static stylesheet = Stylesheet.create({
    Root: {
      Component: Error,
    },
  });

  static propTypes = {
    errorCode: PropTypes.string.isRequired
  };

  render() {
    let {Root} = this.constructor.stylesheet;

    let message;
    if (this.props.errorCode == 'ASSESSMENT_NOT_FOUND') {
      message = this._('The selected Assessment could not be retrieved.');
    } else if (this.props.errorCode === 'ASSESSMENT_NOT_COMPLETE') {
      message = this._('The selected Assessment is not yet complete.');
    } else if (this.props.errorCode === 'NO_FORMS') {
      message = this._('There are no Forms configured in the system that can display the selected Assessment.');
    } else {
      message = this._('An unexpected error has occurred.');
    }

    return <Root message={message} />;
  }
});

