/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import React, {PropTypes} from 'react';

export let contextTypes = {
  self: PropTypes.object.isRequired,
  defaultLocalization: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  event: PropTypes.object,
  parameters: PropTypes.object,
  apiUrls: PropTypes.object,
};

export default class FormContext extends React.Component {

  static childContextTypes = contextTypes;

  render() {
    return React.Children.only(this.props.children);
  }

  getChildContext() {
    let {form, self, parameters, event, apiUrls} = this.props;
    return {
      self,
      defaultLocalization: form.defaultLocalization,
      event,
      form,
      parameters,
      apiUrls,
    };
  }
}

