/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as Transitionable from 'rex-widget/lib/Transitionable';
import * as T from './model/Type';
import compileExpression from './compileExpression';
import type {PreInstruction} from './parseInstruction';

/* istanbul ignore next */
Transitionable.register('type:any', function decode_type_any() {
  return T.anytype;
});

/* istanbul ignore next */
Transitionable.register('type:value', function decode_type_value(payload) {
  return new T.ValueType(payload);
});

/* istanbul ignore next */
Transitionable.register('type:entity', function decode_type_entity(payload) {
  return new T.EntityType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register('type:row', function decode_type_row(payload) {
  return new T.RowType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register('type:record', function decode_type_record(payload) {
  return new T.RecordType(payload[0], payload[1]);
});

/* istanbul ignore next */
Transitionable.register(
  'rex:action:start',
  function decode_action_start(payload): PreInstruction {
    let [then] = payload;
    return {
      type: 'start',
      then,
    };
  },
);

/* istanbul ignore next */
Transitionable.register(
  'rex:action:execute',
  function decode_action_execute(payload): PreInstruction {
    let [id, name, then] = payload;
    return {
      type: 'execute',
      id,
      name,
      then,
    };
  },
);

/* istanbul ignore next */
Transitionable.register(
  'rex:action:include_wizard',
  function decode_action_include(payload): PreInstruction {
    let [id, name, then] = payload;
    return {
      type: 'include',
      id,
      name,
      then,
    };
  },
);

/* istanbul ignore next */
Transitionable.register(
  'rex:action:replace',
  function decode_action_replace(payload): PreInstruction {
    let [reference] = payload;
    return {
      type: 'replace',
      reference,
    };
  },
);

/* istanbul ignore next */
Transitionable.register(
  'rex:action:repeat',
  function decode_action_repeat(payload): PreInstruction {
    let [repeat, then] = payload;
    return {
      type: 'repeat',
      repeat,
      then,
    };
  },
);

/* istanbul ignore next */
Transitionable.register('rex:action:domain', function decode_domain(payload) {
  return payload[0];
});

Transitionable.register(
  'rex:action:state_expr',
  function decode_state_expression(payload) {
    const [source, scope] = payload;
    return compileExpression(source, scope);
  },
);
