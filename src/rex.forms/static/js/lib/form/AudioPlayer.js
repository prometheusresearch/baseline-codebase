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

    if (this.context.apiUrls.resourcePrefix) {
      let prefix = this.context.apiUrls.resourcePrefix;
      if (prefix.endsWith('/')) {
        prefix = prefix.slice(0, -1);
      }

      source = source.map((src) => {
        if (src.startsWith('/')) {
          src = prefix + src;
        }
        return src;
      })
    }

    return (
      <AudioPlayerBase
        {...this.props}
        source={source}
        />
    );
  }
}

