/**
 * @flow
 */

export const withCatcher = <T>(
  fn: () => T,
  catcher: (err: Error) => any,
  defaultValue: T
): T => {
  let result = defaultValue;

  try {
    result = fn();
  } catch (err) {
    catcher(err);
  }

  return result;
};
