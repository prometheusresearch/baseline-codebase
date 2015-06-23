/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react/addons');
var RexWidget = require('rex-widget');

var WizardLink = React.createClass({

  render() {
    var {action, context, params, ...props} = this.props;
    params = {
      ...params,
      action: action.join('/'),
      context: context
    };
    return <RexWidget.Link {...props} params={params} />;
  }
});

module.exports = WizardLink;
