/**
 * @flow
 */

// eslint-disable-next-line no-console
console.error(
  `
Module "rex-action/lib/execution/Command" is deprecated, use:

  import {Command} from "rex-action"

instead.
  `.trim(),
);

module.exports = require('../model/Command');
