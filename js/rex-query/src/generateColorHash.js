/**
 * @flow
 */

import ColorHash from "color-hash";
import memoize from "lodash/memoize";

const _colorHash = new ColorHash();

export function generateColorHash(value: string) {
  return _colorHash.hex(value);
}

export const generateColorHashMemoized = memoize<string, string>(generateColorHash);

export default generateColorHash;
