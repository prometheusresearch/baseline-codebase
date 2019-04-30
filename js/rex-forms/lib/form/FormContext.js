/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';

export let contextTypes = {
  self: PropTypes.object.isRequired,
  defaultLocalization: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  event: PropTypes.object,
  parameters: PropTypes.object,
  apiUrls: PropTypes.object,
  widgetConfig: PropTypes.object,
};

export default class FormContext extends React.Component {

  static childContextTypes = contextTypes;

  render() {
    return React.Children.only(this.props.children);
  }

  getChildContext() {
    let {form, self, parameters, event, apiUrls, widgetConfig} = this.props;
    return {
      self,
      widgetConfig,
      defaultLocalization: form.defaultLocalization,
      event,
      form,
      parameters,
      apiUrls,
    };
  }
}

