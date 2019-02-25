/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {
  REXLResolver,
  REXLExpression
} from 'rex-expression';

import type {
  Derivation
} from 'derivable';

import type {
  RIOSForm,
  RIOSEvent,
  RIOSHideEvent,
  RIOSDisableEvent,
  RIOSHideEnumerationEvent,
  RIOSFailEvent,
  RIOSLocalizedString,
  JSONSchemaExt,
  KeyPath,
} from '../../types';

import type {
  Locator
} from './TargetIndex';

import {select as selectSchema} from 'react-forms/src/Schema';
import * as REXL from 'rex-expression';
import invariant from 'invariant';
import get from 'lodash/get';
import flatten from 'lodash/flatten';
import some from 'lodash/some';
import {derivation} from 'derivable';

import cast from '../../cast';
import resolve from './resolve';
import * as TargetIndex from './TargetIndex';

import {forEachQuestion} from '../Traversal';

export type EventComputation<T: RIOSEvent, R> = {
  event: T;
  compute: (globalScope: Scope, targetScope: ?Scope) => Derivation<R>;
  locateScope: ?Locator;
};

type ActionInfo<T, R> = {
  eventList: Array<EventComputation<T, R>>;
  locate: ?Locator;
};

export type ActionIndex = {
  fail: {
    [eventID: string]: ActionInfo<RIOSFailEvent, ?RIOSLocalizedString>
  };
  disable: {
    [eventID: string]: ActionInfo<RIOSDisableEvent, boolean>
  };
  hide: {
    [eventID: string]: ActionInfo<RIOSHideEvent, boolean>
  };
  hideEnumeration: {
    [eventID: string]: ActionInfo<RIOSHideEnumerationEvent, Array<string>>
  };
};

export type EventIndex = {
  tag: ActionIndex;
  page: ActionIndex;
  field: ActionIndex;
};

export type Scope = {
  node: JSONSchemaExt;
  value: Derivation<mixed>;
  keyPath: KeyPath;
}

type NestedScope = Array<Scope>;

/**
 * Create an event index by inspecting form.
 */
export function createEventIndex(
  form: RIOSForm,
  parameters?: Object = {}
): EventIndex {
  let targetIndex = TargetIndex.createTargetIndex(form);

  let tag = createEmptyActionIndex();
  let page = createEmptyActionIndex();
  let field = createEmptyActionIndex();

  // $FlowIssue: no
  function registerEventImpl<T : RIOSEvent, R>(
    context,
    isTargetScoped: boolean,
    registry: {[id: string]: ActionInfo<T, R>},
    id: string,
    event: T,
    locate: ?Locator,
  ) {
    registry[id] = registry[id] || {
      eventList: [],
      locate: null,
    };

    if (locate) {
      registry[id].locate = locate;
    }

    let compute;
    let locateScope;

    // matrix row
    if (context.parent && context.row) {
      const parent = context.parent;
      const rows = parent.rows;
      invariant(rows != null, 'Missing rows');

      // eval in the same matrix row scope
      if (isTargetScoped) {

        locateScope = (_value) =>
          rows.map(row =>
            [parent.fieldId, 'value', row.id]);

        compute = (globalScope: Scope, targetScope: ?Scope) => {
          invariant(
            targetScope != null,
            'Cannot eval event without local scope'
          );
          return computationForEvent(event, [targetScope, globalScope], parameters);
        };

      // eval in each matrix row scopes and aggregate
      } else {

        compute = (globalScope: Scope, _targetScope: ?Scope) => {
          let scopeList = rows
            .map(row => {
              let localScope = selectScope(
                globalScope,
                [parent.fieldId, 'value', row.id]
              );
              if (localScope == null) {
                return null;
              }
              return [localScope, globalScope];
            })
            .filter(item => item != null);
          return aggregatedComputationForEvent(event, scopeList, parameters);
        };

      }

    // record list item
    } else if (context.parent) {

      const parent = context.parent;

      // eval in the same record list item scope
      if (isTargetScoped) {

        compute = (globalScope: Scope, targetScope: ?Scope) => {
          invariant(
            targetScope != null,
            'Cannot eval event without local scope'
          );
          return computationForEvent(event, [targetScope, globalScope], parameters);
        };

        locateScope = (value) => {
          let recordList: Array<*> = cast(get(value, [parent.fieldId, 'value'])) || [];
          return recordList.map((item, idx) =>
            [parent.fieldId, 'value', idx]);
        };

      // eval in each record list item scope and aggregate
      } else {
        const fieldId= context.parent.fieldId;

        compute = (globalScope: Scope, _targetScope: ?Scope) => {
          let value = get(globalScope.value.get(), [fieldId, 'value']) || [];
          let scopeList = value
            .map((item, idx) => {
              let localScope = selectScope(
                globalScope,
                [fieldId, 'value', idx]
              );
              invariant(localScope != null, 'Missing local scope');
              return [localScope, globalScope];
            })
            .filter(item => item != null);

          return aggregatedComputationForEvent(event, scopeList, parameters);
        };

      }

    // global
    } else {

      compute = (globalScope: Scope, _targetScope: ?Scope) =>
        computationForEvent(event, [globalScope], parameters);

    }

    registry[id].eventList.push({
      event,
      compute,
      locateScope,
    });
  }

  function registerEvent(
    context,
    index: ActionIndex,
    id: string,
    registration: {
      isTargetScoped: boolean;
      event: RIOSEvent;
      locate?: ?Locator;
      locateScope?: ?Locator;
    }
  ) {
    const {isTargetScoped, event, locate, locateScope} = registration;
    switch (event.action) {
      case 'fail':
        registerEventImpl(context, isTargetScoped, index.fail, id, event, locate, locateScope);
        break;
      case 'hide':
        registerEventImpl(context, isTargetScoped, index.hide, id, event, locate, locateScope);
        break;
      case 'hideEnumeration':
        registerEventImpl(context, isTargetScoped, index.hideEnumeration, id, event, locate, locateScope);
        break;
      case 'disable':
        registerEventImpl(context, isTargetScoped, index.disable, id, event, locate, locateScope);
        break;
      default:
        invariant(false, 'Invalid action found: %s', registration.event.action);
    }
  }

  forEachQuestion(form, (question, context) => {

    if (!question.events) {
      return;
    }

    for (let i = 0; i < question.events.length; i++) {
      let event = question.events[i];

      let {targets = [question.fieldId]} = event;

      for (let j = 0; j < targets.length; j++) {

        let target = targetIndex[targets[j]];
        let isTargetScoped = false;

        if (target == null && context.parent != null) {
          let localIndex = TargetIndex.getLocalTargetIndex(
            targetIndex,
            context.parent.fieldId
          );
          target = localIndex[targets[j]];
          isTargetScoped = true;
        }

        if (!target) {
          // FIXME: handle unknown target.
          continue;
        }
        if (target.type === 'tag') {
          target.elements.forEach(element => {
            if (element.type === 'question') {
              const questionTarget = targetIndex[element.options.fieldId];
              invariant(
                questionTarget.type === 'field',
                'Invalid target classification'
              );
              questionTarget.target.forEach(id => {
                registerEvent(context, field, id, {
                  isTargetScoped,
                  event,
                  locate: questionTarget.locate,
                  locateScope: questionTarget.locateScope,
                });
              });
            }
          });
          target.target.forEach(id => {
            registerEvent(context, tag, id, {isTargetScoped, event}, context);
          });
        } else if (target.type === 'page') {
          target.target.forEach(id => {
            registerEvent(context, page, id, {isTargetScoped, event}, context);
          });
        } else if (target.type === 'field') {
          const locate = target.locate;
          const locateScope = target.locateScope;
          target.target.forEach(id => {
            registerEvent(context, field, id, {
              isTargetScoped, event,
              locate, locateScope
            });
          });
        } else {
          invariant(false, 'Invalid target type found: %s', target.type);
        }
      }
    }
  });

  return {tag, page, field};
}

export function selectScope(scope: Scope, keyPath: KeyPath): ?Scope {
  let {value, node} = scope;
  let nextNode = selectSchema(node, keyPath);
  if (nextNode == null) {
    return null;
  }
  return {
    value: value.derive(value => get(value, keyPath)),
    node: nextNode,
    keyPath: scope.keyPath.concat(keyPath),
  };
}

function createEmptyActionIndex(): ActionIndex {
  return {
    fail: {},
    disable: {},
    hide: {},
    hideEnumeration: {},
  };
}


let REXL_FALSE = REXL.parse('false()');

function getExpression(event: RIOSEvent): REXLExpression {
  if (event.triggerParsed == null) {
    try {
      event.triggerParsed = REXL.parse(event.trigger);
    } catch (exc) {
      console.error(`Could not PARSE ${event.action} Event Trigger "${event.trigger.trim()}": ${exc}`);
      event.triggerParsed = REXL_FALSE;
    }
  }
  return event.triggerParsed;
}

function resolverForScope(scope: NestedScope, parameters): REXLResolver {
  return id => {
    for (let i = 0; i < scope.length; i++) {
      let res = resolve(id, scope[i].node, scope[i].value.get(), parameters);
      if (res != null) {
        return res ;
      }
    }
    return REXL.Untyped.value(null);
  };
}

function computationWithScope<R>(
  event: RIOSEvent,
  scope: NestedScope,
  parameters: Object,
  process: (result: mixed) => R,
): Derivation<R> {
  let resolver = resolverForScope(scope, parameters);
  let expression = getExpression(event);
  return derivation(() => {
    let result;
    try {
      result = expression.evaluate(resolver);
    } catch (exc) {
      console.error(`Could not EXECUTE ${event.action} Event Trigger "${event.trigger.trim()}": ${exc}`);
      result = false;
    }
    return process(result);
  });
}

function booleanComputation(
  event: RIOSHideEvent | RIOSDisableEvent,
  scope: NestedScope,
  parameters: Object
): Derivation<boolean> {
  return computationWithScope(event, scope, parameters, result => !!result);
}

function failComputation(
  event: RIOSFailEvent,
  scope: NestedScope,
  parameters: Object
): Derivation<?RIOSLocalizedString> {
  return computationWithScope(event, scope, parameters, result =>
    result ? [event.options.text] : []);
}

function hideEnumerationComputation(
  event: RIOSHideEnumerationEvent,
  scope: NestedScope,
  parameters: Object
): Derivation<Array<string>> {
  return computationWithScope(event, scope, parameters, result =>
    result ? event.options.enumerations : []);
}

function computationForEvent(
  event: RIOSEvent,
  scope: NestedScope,
  parameters: Object
) {
  switch (event.action) {
    case 'hide':
    case 'disable':
      return booleanComputation(event, scope, parameters);
    case 'fail':
      return failComputation(event, scope, parameters);
    case 'hideEnumeration':
      return hideEnumerationComputation(event, scope, parameters);
    default:
      invariant(false, 'Unknown event action: %s', event.action);
  }
}

function aggregatedComputationForEvent(
  event: RIOSEvent,
  scopeList: Array<NestedScope>,
  parameters: Object
) {
  const ev = event;
  return derivation(() => {
    switch (ev.action) {
      case 'hide':
      case 'disable':
        return some(scopeList, scope =>
          booleanComputation(ev, scope, parameters).get());
      case 'fail':
        return flatten(scopeList.map(scope =>
          failComputation(ev, scope, parameters).get()));
      case 'hideEnumeration':
        return flatten(scopeList.map(scope =>
          hideEnumerationComputation(ev, scope, parameters).get()));
      default:
        invariant(false, 'Unknown event action: %s', ev.action);
    }
  });
}
