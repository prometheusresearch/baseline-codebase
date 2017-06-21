/**
 * This module provides a function which generates an unique id.
 *
 * This modules exists solely for purpose of convenient mocking through in
 * tests
 *
 * The implementation is currently based on `lodash/uniqueId` function.
 *
 * @flow
 */

import generateUniqueId from 'lodash/uniqueId';

export default (generateUniqueId: (prefix: string) => string);
