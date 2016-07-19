/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import LocalizedString from './LocalizedString';

export default function QuestionValueResult({question, value}) {
  if (question.enumerations) {
    for (let i = 0; i < question.enumerations.length; i += 1) {
      if (question.enumerations[i].id === value) {
        return <LocalizedString text={question.enumerations[i].text} />;
      }
    }
  }

  if (value == null) {
    return <span>{'—'}</span>;
  } else {
    return <span>{String(value)}</span>;
  }
}
