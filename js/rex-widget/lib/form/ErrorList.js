/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {VBox} from '../../layout';
import {style} from '../../stylesheet';

let ErrorContainer =  style(VBox, {
  marginTop: 3,
  color: 'red',
  fontSize: '80%'
});

let Error = style(VBox, {
  marginRight: 7
});

export default function ErrorList({errorList}) {
  return (
    <ErrorContainer>
      {errorList.map((error, idx) => <Error key={idx}>{error.message}</Error>)}
    </ErrorContainer>
  );
}
