/**
 * @flow
 */
import invariant from "invariant";
import { type Resource } from "rex-graphql/Resource";

export const calculateItemsLimit = ({
  coords,
  cellStaticHeightValue
}: {
  coords: ClientRect,
  cellStaticHeightValue: number
}) => {
  const height = window.innerHeight;

  let limit: number = 3;
  const delta = window.innerHeight - coords.height;
  const rate = delta / cellStaticHeightValue;

  if (rate > 3) {
    return Math.floor(rate) - 1;
  }

  return limit;
};

// TODO: Add "preferred" argument with fields
export const sortObjectFieldsWithPreferred = (row: Object): Object => {
  const {
    id,
    name,
    first_name,
    last_name,
    title,
    display_name,
    gender,
    sex,
    ...rest
  } = row;
  const sortedRow = Object.keys(rest)
    .sort()
    .reduce((acc, dataKey) => ({ ...acc, [dataKey]: rest[dataKey] }), {
      id,
      name,
      first_name,
      last_name,
      title,
      display_name,
      gender,
      sex
    });

  return sortedRow;
};

export function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value[0].toUpperCase() + value.substring(1);
}
