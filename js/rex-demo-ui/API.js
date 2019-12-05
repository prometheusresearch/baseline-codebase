// @flow

import * as RexGraphQL from "rex-graphql";
import * as Resource from "rex-graphql/Resource";

export let endpoint = RexGraphQL.configure("/_api/graphql");

export let removeUser = Resource.defineMutation<{| userIds: string[] |}, void>({
  endpoint,
  mutation: `
    mutation removeUser($userIds: [user_id]!) {
      remove_user(user_ids: $userIds)
    }
  `,
});

export let addUserToSite = Resource.defineMutation<
  {| userIds: string[], siteId: string |},
  void,
>({
  endpoint,
  mutation: `
    mutation addUserToSite($userIds: [user_id]!, $siteId: site_id!) {
      add_user_to_site(user_ids: $userIds, site_id: $siteId)
    }
  `,
});
