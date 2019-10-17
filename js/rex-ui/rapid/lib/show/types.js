import type { Endpoint } from "rex-graphql";
import type { Resource } from "rex-graphql/Resource";

export type TShowPropsBase = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: Array<string>,
  Renderer?: React.ComponentType<any>,
  onPick?: () => void
|};

export type TShowProps = {|
  ...TShowPropsBase,
  resource: Resource<Object, any>
|};

export type TSchemaMeta = {| ...Object |};

export type TRendererProps = {|
  resource: Resource<void, any>,
  Renderer: React.ComponentType<{ data: any }>
|};
