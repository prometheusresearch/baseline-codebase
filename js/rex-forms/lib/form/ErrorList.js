/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactForms from 'react-forms/reactive';
import {style} from '@prometheusresearch/react-ui-0.21/stylesheet';
import Error from './Error';


export default function (props) {
  return (
    <ReactForms.ErrorList
      {...props}
      errorComponent={({error}) => {
        return <Error text={error.message} />;
      }}
    />
  );
}

