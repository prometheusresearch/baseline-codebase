/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import withFormValue from './withFormValue';
import * as Schema from './Schema';

export {validate} from './Schema';
export {update} from './update';
export {default as Fieldset} from './Fieldset';
export {Schema, withFormValue};
export {default as Input} from './Input';
export {default as ErrorList} from './ErrorList';
export {create as createValue, suppressUpdate, Value} from './Value';
export {default as Field} from './Field';

export function WithFormValue(...args) {
  console.error('WithFormValue(..) is renamed to withFormValue(..)'); // eslint-disable-line no-console
  return withFormValue(...args);
}
