/**
 * @copyright 2016, Prometheus Research, LLC
 */


import React from 'react';

import DictionaryPick from './DictionaryPick';
import Title from './Title';


export default class DictionaryPickEnumeration extends DictionaryPick {
  static targetContext = 'mart_enumeration';
  static contextParams = ['mart_column'];

  static renderTitle({title}, {mart_enumeration}) {
    return (
      <Title
        title={title}
        subtitle={mart_enumeration}
        />
    );
  }
}


