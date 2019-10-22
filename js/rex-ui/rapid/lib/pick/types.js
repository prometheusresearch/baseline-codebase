import type { Endpoint } from "rex-graphql";
import type { Resource } from "rex-graphql/Resource";

export type TPickPropsBase = {|
  endpoint: Endpoint,
  fetch: string,
  fields?: Array<string>,
  Renderer?: React.ComponentType<any>,
  onPick?: () => void
|};

export type TPickProps<P, V> = {|
  ...TPickPropsBase,
  resource: Resource<P, V>
|};

export type TSchemaMeta = {| ...Object |};

export type TRendererProps = {|
  resource: Resource<void, any>,
  Renderer: React.ComponentType<{ data: any }>,
  fetch: string,
  catcher: (err: Error) => void
|};
