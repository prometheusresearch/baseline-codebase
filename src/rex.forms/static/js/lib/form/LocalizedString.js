/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import {InjectI18N} from 'rex-i18n';

import * as FormContext from './FormContext';
import isReactElement from '../isReactElement';


@InjectI18N
export default class LocalizedString extends React.Component {

  static propTypes = {
    text: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired,
  };

  static contextTypes = FormContext.contextTypes;

  static defaultProps = {
    Component: 'span',
  };

  render() {
    let {Component, text, ...props} = this.props;
    let locale = this.getI18N().config.locale;
    let baseLanguage = this.getI18N().getLanguage();

    let localizedText;
    if (!text) {
      localizedText = '';

    } else if ((typeof text === 'string') || isReactElement(text) || (text instanceof String)) {
      localizedText = text;

    } else if (text[locale]) {
      localizedText = text[locale];

    } else if (text[baseLanguage]) {
      localizedText = text[baseLanguage];

    } else {
      localizedText = text[this.context.defaultLocalization];
    }

    return (
      <Component {...props}>
        {localizedText}
      </Component>
    );
  }
}

