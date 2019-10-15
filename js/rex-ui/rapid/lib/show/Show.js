/**
 * @flow
 */

/**
 * TODO: react-match-mq
 */
import * as React from "react";
import { string } from "prop-types";
import { toJS } from "../../helpers/await-to-js";

import { useQuery } from "../../../../rex-graphql";
import type { Endpoint } from "../../../../rex-graphql";

type TShowProps = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: Array<string>,
  renderer?: TRendererProps => React.Node,
  onPick?: () => void
|};

type TGQLData = { [key: string]: any };

type TRendererProps = {|
  gqlData: TGQLData
|};

type TSchemaMeta = {| ...Object |};

const renderer = rendererProps => {
  return <div>Some rendered things</div>;
};

const COMMON_FIELDS = ["id", "name", "title", "display_name", "username"];

const getScalarsFromMeta = (gqlMeta: ?string) => {
  return ``;
};

const getRendererProps = ({ gqlData }: TRendererProps) => {};

const fetchGqlMeta = (endpoint: Endpoint) => Promise.resolve(``);

const constructFields = (gqlMeta: ?string) => {
  return ``;
};

const constructFieldsPath = (gqlMeta: ?string) => (fieldsStr: string) => {
  return `
    users {
        paginated(limit: $limit, offset: $offset) {
            ${fieldsStr}
        }
    }
`;
};

const constructQueryFromMeta = (gqlMeta: ?string, fields?: Array<string>) => {
  const fieldsStr = constructFields(gqlMeta);

  return `query($limit: Int!, $offset: Int!) {
        ${constructFieldsPath(gqlMeta)(fieldsStr)}
    }`;
};

const Show = React.memo((props: TShowProps) => {
  const { endpoint, fetch } = props;
  const [meta, setMeta] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState<string>("");
  const [variables, setVariables] = React.useState<Object>({});

  const lifecycle = () => {};

  const gqlData = useQuery(endpoint, query, variables, {});

  /**
   * Get Introspection meta
   */
  React.useEffect(() => {
    (async () => {
      const [errSchemaMeta, schemaMeta] = await toJS<TSchemaMeta>(
        fetchGqlMeta(endpoint)
      );

      if (schemaMeta != null) {
        setMeta(schemaMeta);
      }
    })();
  }, [endpoint, fetch]);

  /**
   * Get Query
   */
  React.useEffect(() => {
    (async () => {
      const query = constructQueryFromMeta(meta);
      setQuery(query);
    })();
  }, [meta]);

  /**
   * Get data from Query
   */
  React.useEffect(() => {
    (async () => {})();
  }, [query]);

  const rendererProps = getRendererProps({ gqlData });

  return renderer(rendererProps);
});
