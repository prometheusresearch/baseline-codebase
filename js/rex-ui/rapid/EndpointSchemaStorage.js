/**
 * EndpointSchemaStorage allows to fetch GraphQL schema for a GraphQL endpoint
 * and provides caching layer.
 *
 * @flow
 */

import * as RexGraphQL from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import {
  getIntrospectionQuery,
  type IntrospectionQuery,
  type IntrospectionSchema
} from "graphql";

let cache = new Map();

function getResource(endpoint: RexGraphQL.Endpoint) {
  let resource = cache.get(endpoint);
  if (resource == null) {
    resource = Resource.defineQuery<void, IntrospectionQuery>({
      endpoint,
      query: getIntrospectionQuery()
    });
    cache.set(endpoint, resource);
  }
  return resource;
}

/**
 * Fetch IntrospectionSchema for an Endpoint.
 */
export function useIntrospectionSchema(
  endpoint: RexGraphQL.Endpoint
): IntrospectionSchema {
  let resource = getResource(endpoint);
  return Resource.unstable_useResource(resource).__schema;
}
