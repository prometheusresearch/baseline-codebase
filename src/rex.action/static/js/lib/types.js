/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

export type Context = {
  [name: string]: string,
};

export type PerActionState = {
  [id: string]: Object,
};

export type Entity = {
  [prop: string]: mixed,
  id: string,
  'meta:type': string,
  'meta:title': ?string,
  __title__: ?string,
  title: ?string,
};

export type Domain = {
  [entityName: string]: {
    [stateName: string]: {
      expression: (Entity) => boolean,
    },
  },
};
