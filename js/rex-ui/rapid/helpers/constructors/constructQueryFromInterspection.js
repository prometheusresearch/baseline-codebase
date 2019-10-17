/**
 * @flow
 */

import invariant from "invariant";

const getScalarsFromMeta = (gqlMeta: ?string) => {
  return ``;
};

const constructFields = (gqlMeta: ?string) => {
  return ``;
};

const constructFieldsPath = (path: ?string) => {
  invariant(
    path != null,
    "path argument passed for constructFieldsPath is null"
  );

  return ``;
};

/**
 * TODO: Implement actual construction algorithm
 */
export const constructQueryFromInterspection = ({
  meta,
  fields,
  path
}: {
  meta: ?string,
  fields?: Array<string>,
  path: string
}) => {
  const fieldsStr = constructFields(meta);

  const query = `query {
      user {
        paginated {
            id
        }
      }
    }`;

  return query;
};
