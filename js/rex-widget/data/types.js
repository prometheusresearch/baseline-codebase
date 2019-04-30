/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import type { keypath } from "../KeyPath";

/**
 * Interface for data fetchers.
 */
export type Fetcher<T> = {
  +path: string,

  /**
   * Start fetching data.
   */
  produce(): Promise<T>,

  /**
   * Limit dataset.
   */
  limit(top: number, skip?: number): Fetcher<T>,

  /**
   * Sort dataset.
   */
  sort(key: keypath, asc: boolean): Fetcher<T>,

  /**
   * Set Params.
   */
  params(params: { [name: string]: mixed }): Fetcher<T>,

  equals(Fetcher<T>): boolean,

  getSingleEntity(): Fetcher<$ElementType<T, number>>,

  key(): $ReadOnlyArray<mixed>
};
