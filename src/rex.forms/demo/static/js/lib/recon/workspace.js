/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import React from 'react';
import {Reconciler} from 'rex-forms';
import {Provider} from 'rex-i18n';

export default class Workspace extends React.Component {

  static propTypes = {
    mountPoint: React.PropTypes.string.isRequired,
    apiUrls: React.PropTypes.object.isRequired,
    i18nUrl: React.PropTypes.string.isRequired,
    recon: React.PropTypes.object.isRequired,
    options: React.PropTypes.object
  };

  static defaultProps = {
    options: {}
  };

  onComplete(reconState) {
    console.log('complete', reconState);
  }

  render() {
    let Component = Reconciler;

    if (this.props.recon.id === 'custom_widget') {
      Component = require('../CustomWidgetDemo').default;
    }

    return (
      <Provider
        locale={this.props.options.locale}
        baseUrl={this.props.i18nUrl}>
        <Component
          Form={Reconciler}
          instrument={this.props.recon.instrument}
          form={this.props.recon.form}
          parameters={this.props.recon.parameters}
          discrepancies={this.props.recon.discrepancies}
          entries={this.props.recon.entries}
          onComplete={this.onComplete}
          apiUrls={this.props.apiUrls}
          />
      </Provider>
    );
  }
}
