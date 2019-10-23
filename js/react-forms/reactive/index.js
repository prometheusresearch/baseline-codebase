/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as Schema from '../Schema';

export {update} from '../update';
export {validate} from '../Schema';
export {Schema};
export {default as Fieldset} from '../Fieldset';
export {default as Input} from '../Input';

export {create as createValue} from './Value';
export {reactive} from 'react-derivable';

import {reactive} from 'react-derivable';
import {withFormValue as withFormValueBase, type Props} from '../withFormValue';
import ErrorListBase from '../ErrorList';
import FieldBase from '../Field';

export function withFormValue<P: Props>(
  Component: React.AbstractComponent<P>
): React.AbstractComponent<P> {
  return withFormValueBase(reactive(Component));
}

export let Field = reactive(FieldBase);
export let ErrorList = reactive(ErrorListBase);
