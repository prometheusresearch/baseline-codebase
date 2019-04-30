/**
 * This module implements type system model.
 *
 * @flow
 */

import type { Domain } from "./types";

/* eslint-disable no-use-before-define */

/**
 * Domain represents data schema.
 */
export const emptyDomain: Domain = { aggregate: {}, entity: {} };
