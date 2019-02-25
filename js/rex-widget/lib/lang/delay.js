/**
 * @copyright 2016, Prometheus Research, LLC
 */

/**
 * Create a promise which resolves after `ms` amount of milliseconds.
 */
export default function delay(ms = 0) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
