/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import autobind from 'autobind-decorator';
import isArray from 'lodash/isArray';

import ViewValue from './ViewValue';
import MarkupString from '../MarkupString';
import * as FormContext from './../FormContext';


export default class ViewEnumerationValue extends ViewValue {
  static contextTypes = {
    ...ViewValue.contextTypes,
    ...FormContext.contextTypes
  };

  @autobind
  getEnumString(id) {
    let enumerations = this.props.question.enumerations || [];
    enumerations = enumerations.filter((enumeration) => {
      return enumeration.id === id;
    });

    if (enumerations.length > 0) {
      let locale = this.getI18N().config.locale;
      let baseLanguage = this.getI18N().getLanguage();

      let str = enumerations[0].text[locale];
      if (!str) {
        str = enumerations[0].text[baseLanguage];
      }
      if (!str) {
        str = enumerations[0].text[this.context.defaultLocalization];
      }

      return <MarkupString key={id} inline>{str}</MarkupString>;
    } else {
      return <span key={id}>{id}</span>;
    }
  }

  getValueString() {
    let value = this.props.formValue.value;
    if ((value == null) || (value.length === 0)) {
      return null;
    }
    if (!isArray(value)) {
      value = [value];
    }

    let ret = [];
    value.forEach((val, idx) => {
      if (idx) {
        ret.push(<span key={idx}>{', '}</span>);
      }
      ret.push(this.getEnumString(val));
    });
    return ret;
  }
}

