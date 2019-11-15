/**
 * This module implement form target index.
 *
 * A datastructure which traverses entire RIOS form and classificates every item
 * which an be targeted from form events.
 *
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { RIOSForm, RIOSElement } from "../../types";

import type { Scope } from "./EventIndex";

import invariant from "invariant";
import get from "lodash/get";

import cast from "../../cast";

import { forEachQuestion, forEachTag } from "../Traversal";

export type Locator = (value: mixed) => Array<Array<string | number>>;

// Pages can be targets
export type PageTargetIndexItem = {
  type: "page",
  target: Array<string>,
};

// Tags can be targets.
export type TagTargetIndexItem = {
  type: "tag",
  target: Array<string>,
  elements: Array<RIOSElement>,
};

// Fields can be targets and some of the fields are scoped (within matrix row or
// within record list item).
export type FieldTargetIndexItem = {
  type: "field",
  target: Array<string>,
  locate: Locator,
  index: { [targetID: string]: FieldTargetIndexItem },
};

export type TargetIndexItem =
  | PageTargetIndexItem
  | FieldTargetIndexItem
  | TagTargetIndexItem;

export type TargetIndex = {
  [targetID: string]: TargetIndexItem,
};

export function getLocalTargetIndex(
  index: TargetIndex,
  id: string,
): { [targetID: string]: FieldTargetIndexItem } {
  let item = index[id];

  invariant(item != null && item.type === "field", "Invalid index structure");

  return item.index;
}

export function createTargetIndex(form: RIOSForm): TargetIndex {
  let index: TargetIndex = (Object.create(null): any);

  forEachQuestion(form, (question, ctx) => {
    const { row, parent, page } = ctx;

    // register page
    index[page.id] = {
      type: "page",
      target: [page.id],
    };

    if (parent == null) {
      // register top level page
      index[question.fieldId] = {
        type: "field",
        target: [question.fieldId],
        locate: function locate(_value) {
          return [[question.fieldId, "value"]];
        },
        index: {},
      };

      // register row-level questions
    } else if (row != null && parent != null) {
      const rows = parent.rows;

      invariant(rows != null, "Invalid question");

      const id = `${parent.fieldId}.${row.id}.${question.fieldId}`;

      // register top level reference
      index[id] = {
        type: "field",
        target: [id],
        locate: function locateColumn(_value) {
          return [[parent.fieldId, "value", row.id, question.fieldId, "value"]];
        },
        index: {},
      };

      // column reference
      const localIndex = getLocalTargetIndex(index, parent.fieldId);
      if (localIndex[question.fieldId] == null) {
        localIndex[question.fieldId] = {
          type: "field",
          target: [id],
          locate: function locateColumnWithinRow(_value) {
            return [[question.fieldId, "value"]];
          },
          index: {},
        };
      }
      localIndex[question.fieldId].target.push(id);

      // register recordList item questions
    } else if (parent != null) {
      const id = `${parent.fieldId}.${question.fieldId}`;

      // register top level reference
      index[id] = {
        type: "field",
        target: [id],
        locate: function locateEveryRecordListItem(value) {
          let recordList: Array<*> =
            cast(get(value, [parent.fieldId, "value"])) || [];
          return recordList.map((_item, index) => [
            parent.fieldId,
            "value",
            index,
            question.fieldId,
            "value",
          ]);
        },
        index: {},
      };

      // local reference
      const localIndex = getLocalTargetIndex(index, parent.fieldId);
      localIndex[question.fieldId] = {
        type: "field",
        target: [id],
        locate: function locateWithinRecordListItem(_value) {
          return [[question.fieldId, "value"]];
        },
        index: {},
      };
    }
  });

  forEachTag(form, (id, { element }) => {
    let item = index[id];
    if (item == null) {
      item = {
        type: "tag",
        target: [id],
        elements: [],
      };
      index[id] = item;
    }
    invariant(item.type === "tag", "Expected tag but got: %s", item.type);
    item.elements.push(element);
  });

  return index;
}
