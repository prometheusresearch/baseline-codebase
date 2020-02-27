// @flow

import * as RexGraphQL from "rex-graphql";

export let endpoint = RexGraphQL.configure("/_api/graphql");

export * from "./graphql.api";
