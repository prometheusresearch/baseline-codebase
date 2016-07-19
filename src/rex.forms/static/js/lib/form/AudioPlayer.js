/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';

import {InjectI18N} from 'rex-i18n';

import * as FormContext from './FormContext';
import AudioPlayerBase from '../AudioPlayer';


@InjectI18N
export default class AudioPlayer extends React.Component {
  static contextTypes = FormContext.contextTypes;

  render() {
    let locale = this.getI18N().config.locale;
    let baseLanguage = this.getI18N().getLanguage();

    let source = this.props.source[locale];
    if (!source) {
      source = this.props.source[baseLanguage];
    }
    if (!source) {
      source = this.props.source[this.context.defaultLocalization];
    }

    return (
      <AudioPlayerBase
        {...this.props}
        source={source}
        />
    );
  }
}

