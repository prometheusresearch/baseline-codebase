/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React      from 'react';
import RexWidget  from 'rex-widget';

export default class WizardLink extends React.Component {

  render() {
    let {action, context, initialContext, params, ...props} = this.props;
    params = {
      ...params,
      action: action.join('/'),
      context,
      initialContext
    };
    return <RexWidget.Link {...props} params={params} />;
  }
}
