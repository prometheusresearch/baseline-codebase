/**
 * This module implements type system model.
 *
 * @flow
 */

import type {Type} from './Type';

/* eslint-disable no-use-before-define */

/**
 * Domain represents data schema.
 */
export type Domain = {

  // Aggregate catalogue.
  aggregate: {
    [aggregateName: string]: DomainAggregate;
  };

  // Entity catalogue (tables).
  entity: {
    [entityName: string]: DomainEntity;
  };
};

export const emptyDomain = {aggregate: {}, entity: {}};

export type DomainAggregate = {
  title: string;
  name: string;
  isAllowed: (typ: Type) => boolean;
  makeType: (typ: Type) => Type;
};

export type DomainEntity = {
  title: string;
  attribute: DomainAttributeMap;
};

export type DomainAttribute = {
  title: string;
  type: Type;
  groupBy?: boolean;
};

export type DomainAttributeMap = {
  [name: string]: DomainAttribute;
};
