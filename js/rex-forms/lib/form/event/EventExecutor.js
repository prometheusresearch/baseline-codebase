/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { Derivable } from "derivable";
import type {
  JSONSchema,
  JSONObjectSchema,
  JSONSchemaExtension,
  KeyPath,
  RIOSForm,
  RIOSEvent,
} from "../../types";

import type { EventIndex, Scope, EventComputation } from "./EventIndex";

import { derivation } from "derivable";
import { update } from "react-forms/reactive";
import invariant from "invariant";
import get from "lodash/get";
import isArray from "lodash/isArray";
import pullAll from "lodash/pullAll";
import forEach from "lodash/forEach";
import some from "lodash/some";
import flatten from "lodash/flatten";
import mapValues from "lodash/mapValues";
import * as REXL from "rex-expression";
import resolve from "./resolve";

import cast from "../../cast";
import { createEventIndex, selectScope } from "./EventIndex";

export function create(
  form: RIOSForm,
  node: JSONObjectSchema,
  value: Derivable<mixed>,
  parameters: Object,
) {
  let index = createEventIndex(form, parameters);
  let scope = { node, value, keyPath: [] };

  // HACK: Install a side-door for testing/debugging REXL expressions in the
  // context of the current form.
  global.REX_FORMS_EVALUATOR = expression => {
    return REXL.parse(expression).evaluate(id => {
      return (
        resolve(id, node, value.get(), parameters) || REXL.Untyped.value(null)
      );
    });
  };

  return new EventExecutor(index, scope);
}

function childrenScope(scope: Scope): { [keyPath: string]: Scope } {
  let children = {};
  let scopeNode = scope.node;
  invariant(scopeNode.type === "object", "Invalid schema");
  for (let k in (scopeNode: JSONObjectSchema).properties) {
    let node = scopeNode.properties[k];
    invariant(node.instrument && node.instrument.type, "Invalid schema");
    if (node.instrument.type.base === "recordList") {
      let value: Array<mixed> =
        cast(get(scope.value.get(), [k, "value"])) || [];
      value.forEach((_item, idx) => {
        let keyPath = [k, "value", idx];
        children[keyPath.join(".")] = selectScope(scope, keyPath);
      });
    } else if (node.instrument.type.base === "matrix") {
      // $FlowFixMe: ...
      node.instrument.type.rows.forEach(row => {
        let keyPath = [k, "value", row.id];
        children[keyPath.join(".")] = selectScope(scope, keyPath);
      });
    }
  }
  return children;
}

export class EventExecutor {
  index: EventIndex;
  globalScope: Scope;
  localScope: ?Scope;
  children: Derivable<{ [keyPath: string]: EventExecutor }>;

  constructor(index: EventIndex, globalScope: Scope, localScope?: Scope) {
    this.index = index;
    this.children =
      localScope == null
        ? derivation(() =>
            mapValues(
              childrenScope(this.globalScope),
              scope => new EventExecutor(this.index, this.globalScope, scope),
            ),
          )
        : derivation(() => ({}));
    this.globalScope = globalScope;
    this.localScope = localScope;
  }

  get keyPath(): KeyPath {
    return this.localScope ? this.localScope.keyPath : [];
  }

  select(keyPath: KeyPath) {
    let key = keyPath.join(".");
    let child = this.children.get()[key];
    invariant(child != null, "Invalid event executor select: %s", key);
    return child;
  }

  compute = <R, T: EventComputation<RIOSEvent, R>>(event: T): R => {
    let result = event.compute(this.globalScope, this.localScope).get();
    return result;
  };

  computeBatchFor = (index: any, value: any, cb: any) => {
    for (let k in index) {
      let info = index[k];

      info.eventList.forEach(event => {
        let executorList = event.locateScope
          ? event.locateScope(value).map(keyPath => this.select(keyPath))
          : [this];

        executorList.forEach(executor => {
          let keyPathList = info.locate ? info.locate(value) : [];
          keyPathList.forEach(keyPath => {
            cb(executor.compute(event), executor.keyPath.concat(keyPath));
          });
        });
      });
    }
  };

  validate = (value: mixed) => {
    let seenByField = {};
    let errorList = [];

    this.computeBatchFor(this.index.field.fail, value, (failure, keyPath) => {
      if (failure.length > 0) {
        let message = failure[0];
        let field = keyPath.join(".");

        // Because multiple events can produce the same message (eval'ed in
        // different scopes) we need to filter out dups.
        seenByField[field] = seenByField[field] || [];
        if (seenByField[field].indexOf(message) > -1) {
          return;
        }
        seenByField[field].push(message);

        let error = { field, message, force: true };
        errorList.push(error);
      }
    });

    return errorList;
  };

  process = (value: mixed): mixed => {
    this.computeBatchFor(this.index.field.hide, value, (hidden, keyPath) => {
      if (hidden) {
        value = update(value, keyPath, null);
      }
    });
    this.computeBatchFor(
      this.index.field.disable,
      value,
      (disabled, keyPath) => {
        if (disabled) {
          value = update(value, keyPath, null);
        }
      },
    );
    this.computeBatchFor(
      this.index.field.hideEnumeration,
      value,
      (hidden, keyPath) => {
        if (hidden.length > 0) {
          let v: Array<string> | string = get(value, keyPath);
          // enumerationSet value
          if (Array.isArray(v)) {
            value = update(value, keyPath, pullAll(v, hidden));
            /// enumeration value
          } else if (hidden.indexOf((cast(v): string)) > -1) {
            value = update(value, keyPath, null);
          }
        }
      },
    );
    return value;
  };

  isHidden = (id: string): boolean => {
    let info = this.index.field.hide[id];
    if (info == null) {
      return false;
    }
    return some(info.eventList, this.compute);
  };

  isDisabled = (id: string): boolean => {
    let info = this.index.field.disable[id];
    if (info == null) {
      return false;
    }
    return some(info.eventList, this.compute);
  };

  isPageDisabled = (id: string): boolean => {
    let info = this.index.page.disable[id];
    if (info == null) {
      return false;
    }
    return some(info.eventList, this.compute);
  };

  isPageHidden = (id: string): boolean => {
    let info = this.index.page.hide[id];
    if (info == null) {
      return false;
    }
    return some(info.eventList, this.compute);
  };

  isElementHidden = (...tags: Array<string>): boolean => {
    return some(tags, tag => {
      let info = this.index.tag.hide[tag];
      if (info == null) {
        return false;
      }
      return some(info.eventList, this.compute);
    });
  };

  isElementDisabled = (...tags: Array<string>): boolean => {
    return some(tags, tag => {
      let info = this.index.tag.disable[tag];
      if (info == null) {
        return false;
      }
      return some(info.eventList, this.compute);
    });
  };

  hiddenEnumerations = (id: string): Array<string> => {
    let info = this.index.field.hideEnumeration[id];
    if (info == null) {
      return [];
    }
    // $FlowFixMe: ...
    let result = flatten(info.eventList.map(this.compute));
    return result;
  };
}
