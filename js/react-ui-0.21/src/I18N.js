/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

export type I18NContext = {
  dir: 'ltr' | 'rtl';
};

export const contextTypes = {
  i18n: PropTypes.object,
};

export const defaultContext: I18NContext = {
  dir: 'ltr',
};

export class I18N extends React.Component {

  props: I18NContext & {
    children: any;
  };

  static childContextTypes = contextTypes;

  render() {
    let {dir, ...props} = this.props;
    return <div {...props} dir={dir} />;
  }

  getChildContext() {
    let i18n = {
      dir: this.props.dir,
    };
    return {i18n};
  }
}

export default I18N;
