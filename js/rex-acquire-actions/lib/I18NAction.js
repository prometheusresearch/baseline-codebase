/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {Provider} from 'rex-i18n';


export default class I18NAction extends React.Component {
  render() {
    let {locale, i18nBaseUrl, children, ...props} = this.props;

    return (
      <Provider
        locale={locale}
        baseUrl={i18nBaseUrl}>
        <Action {...props}>
          {children}
        </Action>
      </Provider>
    );
  }
}

