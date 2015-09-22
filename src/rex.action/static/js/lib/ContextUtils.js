/**
 * @copyright 2015, Prometheus Research, LLC
 */

export function getMaskedContext(context, inputType) {
  let maskedContext = {};
  for (let key in context) {
    if (
      inputType.rows[key] !== undefined &&
      context[key] != null
    ) {
      maskedContext[key] = context[key];
    }
  }
  return maskedContext;
}
