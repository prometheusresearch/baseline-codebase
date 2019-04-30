/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {TitleBase as Title} from 'rex-action';
import DictionaryPick from './DictionaryPick';

export default class DictionaryPickTable extends DictionaryPick {
  static targetContext = 'mart_table';

  static renderTitle({title}, {mart_table}) {
    return (
      <Title
        title={title}
        subtitle={mart_table}
        />
    );
  }
}

