/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {update} from 'react-forms/reactive';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import pullAll from 'lodash/pullAll';
import forEach from 'lodash/forEach';
import some from 'lodash/some';
import concat from 'lodash/concat';
import REXL from 'rex-expression';
import * as EventCatalog from './EventCatalog';
import resolve from './resolve';

function deriveChildren(scope, schema, value) {
  let children = {};
  for (let key in schema.properties) {
    let node = schema.properties[key];
    // only recordList values have their own scope
    if (node.instrument.type.base !== 'recordList') {
      continue;
    }
    // check if value exists and create scope for each item
    let valueAtNode = get(value, [key, 'value']);
    if (valueAtNode == null) {
      continue;
    }
    for (let i = 0; i < valueAtNode.length; i++) {
      let keyPath = [key, 'value', i];
      children[keyPath.join('.')] = new EventScope(
        scope.unboundCatalog,
        node.properties.value.items,
        scope.value.derive(value => get(value, keyPath)),
        scope.parameters,
        keyPath,
        scope
      );
    }
  }
  return children;
}

function mergeKeyPath(keyPathBase, keyPath) {
  if (keyPathBase.join('.') === keyPath.slice(0, keyPathBase.length)) {
    return keyPath;
  } else {
    return keyPathBase.concat(keyPath);
  }
}

export class EventScope {

  constructor(unboundCatalog, node, value, parameters, keyPath, parent) {
    this.unboundCatalog = unboundCatalog;
    this.catalog = EventCatalog.bind(unboundCatalog, node, value, parameters);
    this.parent = parent;
    this.node = node;
    this.value = value;
    this.parameters = parameters;
    this.keyPath = keyPath;
    this.children = value.derive(value =>
      this.parent ? {} : deriveChildren(this, node, value));
  }

  select(keyPath) {
    let children = this.children.get();
    return children[keyPath.join('.')];
  }

  _processDisable(value) {
    for (let k in this.catalog.field.disable) {
      let item = this.catalog.field.disable[k];
      if (item.computation.get()) {
        let keyPathList = item.keyPath(value);
        for (let i = 0; i < keyPathList.length; i++) {
          let keyPath = mergeKeyPath(this.keyPath, keyPathList[i]);
          value = update(value, keyPath, null);
        }
      }
    }
    return value;
  }

  _processHide(value) {
    for (let k in this.catalog.field.hide) {
      let item = this.catalog.field.hide[k];
      if (item.computation.get()) {
        let keyPathList = item.keyPath(value);
        for (let i = 0; i < keyPathList.length; i++) {
          let keyPath = mergeKeyPath(this.keyPath, keyPathList[i]);
          value = update(value, keyPath, null);
        }
      }
    }
    return value;
  }

  _processHideEnumeration(value) {
    for (let k in this.catalog.field.hideEnumeration) {
      let item = this.catalog.field.hideEnumeration[k];
      let hidden  = item.computation.get();
      let keyPathList = item.keyPath(value);
      for (let i = 0; i < keyPathList.length; i++) {
        let keyPath = mergeKeyPath(this.keyPath, keyPathList[i]);
        let keyValue = get(value, keyPath);
        // Check if we this is an enumerationSet value
        if (isArray(keyValue)) {
          value = update(value, keyPath, pullAll(keyValue, hidden));
        /// Or just an enumeration value
        } else if (hidden.indexOf(keyValue) > -1) {
          value = update(value, keyPath, null);
        }
      }
    }
    return value;
  }

  process = (value) => {
    value = this._processDisable(value);
    value = this._processHide(value);
    value = this._processHideEnumeration(value);
    forEach(this.children.get(), scope => {
      value = scope.process(value);
    });
    return value;
  };

  validate = (value) => {
    let errorList = [];
    for (let k in this.catalog.field.fail) {
      let ev = this.catalog.field.fail[k];
      let failure = ev.compute(value);
      if (failure.length > 0) {
        let keyPathList = ev.keyPath(value);
        keyPathList.forEach(keyPath => {
          let error = {
            field: keyPath.join('.'),
            message: failure[0],
            force: true,
          };
          errorList.push(error);
        });
      }
    }
    return errorList;
  };

  hiddenEnumerations = (id) => {
    let dom = this.catalog.field;
    let set = dom.hideEnumeration[id] ?
      dom.hideEnumeration[id].computation.get() : [];
    if (this.parent) {
      set = concat(set, this.parent.hiddenEnumerations(id));
    }
    return set;
  };

  isDisabled = (id) => {
    let v = (
      this.catalog.field.disable[id] &&
      this.catalog.field.disable[id].computation.get() ||
      this.parent && this.parent.isDisabled(id)
    );
    return v || false;
  };

  isHidden = (id) => {
    let v = (
      this.catalog.field.hide[id] &&
      this.catalog.field.hide[id].computation.get() ||
      this.parent && this.parent.isHidden(id)
    );
    return v || false;
  };

  isElementDisabled = (...tags) => {
    let v = some(tags, tag =>
      this.catalog.tag.disable[tag] &&
      this.catalog.tag.disable[tag].computation.get()
    );
    return v || false;
  };

  isElementHidden = (...tags) => {
    let v = some(tags, tag =>
      this.catalog.tag.hide[tag] &&
      this.catalog.tag.hide[tag].computation.get()
    );
    return v || false;
  };

  isPageDisabled = (id) => {
    let v = (
      this.catalog.page.disable[id] &&
      this.catalog.page.disable[id].computation.get()
    );
    return v || false;
  };

  isPageHidden = (id) => {
    let v = (
      this.catalog.page.hide[id] &&
      this.catalog.page.hide[id].computation.get()
    );
    return v || false;
  };

}

export function create(form, schema, value, parameters = {}, parent = null) {
  let catalog = EventCatalog.create(form);

  // HACK: Install a side-door for testing/debugging REXL expressions in the
  // context of the current form.
  global.REX_FORMS_EVALUATOR = (expression) => {
    return REXL.parse(expression).evaluate((id) => {
      return resolve(id, schema, value.get(), parameters);
    });
  };

  return new EventScope(catalog, schema, value, parameters, [], parent);
}
