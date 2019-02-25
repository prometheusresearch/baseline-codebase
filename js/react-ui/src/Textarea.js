/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {InputProps} from './Input';
import React from 'react';
import Input from './Input';

export default function Textarea(props: InputProps) {
  return <Input rows={3} {...props} Component="textarea" />;
}
