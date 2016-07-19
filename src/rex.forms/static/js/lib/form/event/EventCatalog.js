/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import REXL from 'rex-expression';
import invariant from 'invariant';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import flatten from 'lodash/flatten';
import every from 'lodash/every';
import {derivation} from 'derivable';
import resolve from './resolve';

import {
  forEachQuestion,
  forEachTag,
} from '../Traversal';

/**
 * Find and classify all valid targets within the form.
 */
function createTargetTypeCatalog(form) {
  let catalog = {};

  forEachQuestion(form, (question, {parent, page, row}) => {
    catalog[page.id] = {
      type: 'page',
      id: page.id
    };

    let id;
    let keyPath;
    if (row) {
      id = `${parent.fieldId}.${row.id}.${question.fieldId}`;
      keyPath = _value =>
        [[parent.fieldId, 'value', row.id, question.fieldId, 'value']];
    } else if (parent) {
      id = `${parent.fieldId}.${question.fieldId}`;
      keyPath = value => {
        if (!value || !value[parent.fieldId] || !value[parent.fieldId].value) {
          return [];
        } else {
          return value[parent.fieldId].value.map((_item, idx) =>
            [parent.fieldId, 'value', idx, question.fieldId, 'value']);
        }
      };
    } else {
      id = question.fieldId;
      keyPath = _value =>
        [[question.fieldId, 'value']];
    }

    catalog[question.fieldId] = {
      id,
      keyPath,
      type: 'field',
      targets: {},
    };

    if (parent) {
      let parentCatalog = catalog[parent.fieldId];
      parentCatalog.targets[question.fieldId] = catalog[id] = {
        id,
        keyPath,
        type: 'field',
        targets: {},
      };
    }
  });

  forEachTag(form, (tag, {element}) => {
    catalog[tag] = catalog[tag] || {
      type: 'tag',
      id: tag,
      elements: [],
    };
    catalog[tag].elements.push(element);
  });

  return catalog;
}

/**
 * Helper function which creates an empty catalog per action.
 */
function createActionCatalog() {
  return {
    fail: {},
    disable: {},
    hide: {},
    hideEnumeration: {},
  };
}

/**
 * Create an event catalog by inspecting form.
 */
export function create(form) {
  let targetType = createTargetTypeCatalog(form);

  // mappings from tags, page ids and field ids to events
  let tag = createActionCatalog();
  let page = createActionCatalog();
  let field = createActionCatalog();

  function registerEvent(catalog, action, id, keyPath, event) {
    let item = catalog[action][id] = catalog[action][id] || {
      eventList: [],
      keyPath: null
    };
    if (keyPath) {
      item.keyPath = keyPath;
    }
    item.eventList.push({
      ...event,
      triggerParsed: REXL.parse(event.trigger),
    });
  }

  forEachQuestion(form, (question) => {
    if (question.events) {
      for (let i = 0; i < question.events.length; i++) {
        let event = question.events[i];

        let {
          targets = [question.fieldId],
          action
        } = event;

        for (let j = 0; j < targets.length; j++) {
          let target = targetType[targets[j]];
          if (!target) {
            // TODO: unknown target!
            continue;
          }
          if (target.type === 'tag') {
            target.elements.forEach(element => {
              if (element.type === 'question') {
                let questionTarget = targetType[element.options.fieldId];
                registerEvent(field, action, questionTarget.id, questionTarget.keyPath, event);
              }
            });
            registerEvent(tag, action, target.id, null, event);
          } else if (target.type === 'page') {
            registerEvent(page, action, target.id, null, event);
          } else if (target.type === 'field') {
            registerEvent(field, action, target.id, target.keyPath, event);
          } else {
            invariant(false, 'Invalid target type found: %s', target.type);
          }
        }
      }
    }
  });

  return {tag, page, field};
}

/**
 * Bind catalog to value.
 *
 * Result is the catalog of the same shape as the original one but with the
 * values replaced with derivations (which compute expressions based on form
 * value).
 */
export function bind(catalog, schema, value, parameters = {}) {

  let computeBool = (eventList, resolver) =>
    every(eventList, ev => ev.triggerParsed.evaluate(resolver));

  let computeFail = (eventList, resolver) =>
    eventList
      .map(ev => {
        let fail = ev.triggerParsed.evaluate(resolver);
        return fail ? ev.options.text : null;
      })
      .filter(Boolean);

  let computeHideEnumeration = (eventList, resolver) =>
    flatten(map(eventList, ev => {
      let hidden = ev.triggerParsed.evaluate(resolver);
      return hidden ? ev.options.enumerations : [];
    }));

  let createComputation = action => ({eventList, keyPath}) => {
    if (action === 'fail') {
      let compute = (value) => {
        let resolver = id => resolve(id, schema, value, parameters);
        return computeFail(eventList, resolver);
      };
      return {compute, keyPath, eventList};
    } else {
      let computation = derivation(() => {
        let resolver = id => resolve(id, schema, value.get(), parameters);
        switch (action) {
          case 'hideEnumeration':
            return computeHideEnumeration(eventList, resolver);
          default:
            return computeBool(eventList, resolver);
        }
      });
      return {computation, keyPath, eventList};
    }
  };

  return mapValues(
    catalog,
    perDomain => mapValues(
      perDomain,
      (perAction, action) => mapValues(perAction, createComputation(action))));
}
