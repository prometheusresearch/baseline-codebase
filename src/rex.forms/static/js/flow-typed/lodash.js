// @flow

declare module 'lodash/map' {
  declare export default function map<A, B>(
    collection: Array<A>,
    mapper: (item: A) => B
  ): Array<B>;
}

declare module 'lodash/mapValues' {
  declare export default function mapValues<A, B>(
    collection: {[k: string]: A},
    mapper: (item: A, key: string) => B
  ): {[k: string]: B};
}

declare module 'lodash/flatten' {
  declare export default function flatten<A>(
    collection: Array<Array<A>>
  ): Array<A>;
}

declare module 'lodash/get' {
  declare export default function get(
    value: mixed,
    keyPath: Array<string | number>
  ): ?mixed;
}

declare module 'lodash/every' {
  declare export default function every<A>(
    collection: Array<A>,
    predicate: (item: A) => boolean
  ): boolean;
}

declare module 'lodash/some' {
  declare export default function some<A>(
    collection: Array<A>,
    predicate: (item: A) => boolean
  ): boolean;
}
