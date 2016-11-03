/**
 * This module serves as settings for various features and feature gating.
 *
 * Please make every variable, function exported from here heavily commented as
 * it will help in the future.
 *
 * @flow
 */

/**
 * Artificially limit every select by a given amount of rows. This is used
 * mostly for demos and until we have pagination implemented. If set to `null`
 * means that nothing is limited.
 */
export const FEATURE_ARTIFICIAL_DATASET_LIMIT: ?number = 5;
