/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as Transitionable  from 'rex-widget/lib/Transitionable';
import * as Instruction     from './execution/Instruction';
import {ContextBinding}     from './DataSpecification';
import * as Typing          from './Typing';

Transitionable.register('contextbinding', function decode_query(payload) {
  return new ContextBinding(payload[0], payload[1]);
});

Transitionable.register('type:any', function decode_type_any() {
  return Typing.anytype;
});

Transitionable.register('type:value', function decode_type_value(payload) {
  return new Typing.ValueType(payload);
});

Transitionable.register('type:entity', function decode_type_entity(payload) {
  return new Typing.EntityType(payload[0], payload[1]);
});

Transitionable.register('type:row', function decode_type_row(payload) {
  return new Typing.RowType(payload[0], payload[1]);
});

Transitionable.register('type:record', function decode_type_record(payload) {
  return new Typing.RecordType(payload[0], payload[1]);
});

Transitionable.register('rex:action:start', function decode_type_record(payload) {
  return new Instruction.Start(payload[0]);
});

Transitionable.register('rex:action:execute', function decode_type_record(payload) {
  return new Instruction.Execute(payload[0], payload[1], payload[2]);
});

Transitionable.register('rex:action:include_wizard', function decode_type_record(payload) {
  return new Instruction.IncludeWizard(payload[0], payload[1], payload[2]);
});

Transitionable.register('rex:action:replace', function decode_type_record(payload) {
  return new Instruction.Replace(payload[0]);
});

Transitionable.register('rex:action:repeat', function decode_type_record(payload) {
  return new Instruction.Repeat(payload[0], payload[1]);
});
