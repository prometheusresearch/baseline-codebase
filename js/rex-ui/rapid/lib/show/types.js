import type { Endpoint } from "rex-graphql";
import type { Resource } from "rex-graphql/Resource";

export type TShowPropsBase = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: Array<string>,
  Renderer?: React.ComponentType<any>,
  onPick?: () => void
|};

export type TShowProps<P, V> = {|
  ...TShowPropsBase,
  resource: Resource<P, V>
|};

export type TSchemaMeta = {| ...Object |};

export type TRendererProps = {|
  resource: Resource<void, any>,
  Renderer: React.ComponentType<{ data: any }>
|};
