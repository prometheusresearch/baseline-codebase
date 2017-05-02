/**
 * @flow
 */

// eslint-disable-next-line no-console
console.error(
  `
Module "rex-action/lib/Entity" is deprecated, use:

  import {Entity} from "rex-action"

instead.
  `.trim(),
);

module.exports = require('./model/Entity');
