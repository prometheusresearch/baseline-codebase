/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as Transitionable  from 'rex-widget/lib/Transitionable';
import * as Instruction     from './execution/Instruction';
import * as Typing          from './Typing';

/* istanbul ignore next */
Transitionable.register('type:any', function decode_type_any() {
  return Typing.anytype;
});

/* istanbul ignore next */
Transitionable.register('type:value', function decode_type_value(payload) {
  return new Typing.ValueType(payload);
});

/* istanbul ignore next */
Transitionable.register('type:entity', function decode_type_entity(payload) {
  return new Typing.EntityType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register('type:row', function decode_type_row(payload) {
  return new Typing.RowType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register('type:record', function decode_type_record(payload) {
  return new Typing.RecordType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register('rex:action:start', function decode_type_record(payload) {
  return new Instruction.Start(payload[0]);
});

/* istanbul ignore next */
Transitionable.register('rex:action:execute', function decode_type_record(payload) {
  return new Instruction.Execute(payload[0], payload[1], payload[2], payload[3]);
});

/* istanbul ignore next */
Transitionable.register('rex:action:include_wizard', function decode_type_record(payload) {
  return new Instruction.IncludeWizard(payload[0], payload[1], payload[2], payload[3]);
});

/* istanbul ignore next */
Transitionable.register('rex:action:replace', function decode_type_record(payload) {
  return new Instruction.Replace(payload[0]);
});

/* istanbul ignore next */
Transitionable.register('rex:action:repeat', function decode_type_record(payload) {
  return new Instruction.Repeat(payload[0], payload[1]);
});
