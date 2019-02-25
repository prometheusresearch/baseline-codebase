/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import {Input} from 'react-forms/reactive';
import Widget from '../Widget';

const WIDTH = {
  small: '25%',
  medium: '50%',
  large: '75%',
};

const HEIGHT = {
  small: 50,
  medium: 100,
  large: 250,
};

export default function TextArea({options = {}, ...props}) {
  let {width = 'medium', height = 'medium'} = options;
  return (
    <ReactUI.Block width={WIDTH[width]} height={HEIGHT[height]}>
      <Widget {...props} height="100%">
        <Input Component={ReactUI.Textarea} style={{height: '100%'}} />
      </Widget>
    </ReactUI.Block>
  );
}
