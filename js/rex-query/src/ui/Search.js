/**
 * @flow
 */

import type { QueryNavigation } from "../model/types";

export type SearchResult = {
  value: string,
  label: string
};

export type SearchCallbackParams = {
  searchTerm: ?string,
  navigation: Map<string, QueryNavigation>
};

export type SearchCallback = SearchCallbackParams => Promise<
  Array<SearchResult>
>;

export let dummySearch: SearchCallback = ({ searchTerm, navigation }) => {
  return new Promise((resolve, reject) => {
    if (searchTerm == null) {
      let searchResultList = Array.from(navigation.values());
      resolve(searchResultList);
    } else {
      let searchTermRe = new RegExp(searchTerm, "ig");
      let searchResultList = [];
      for (let item of navigation.values()) {
        if (searchTermRe.test(item.label) || searchTermRe.test(item.value)) {
          searchResultList.push({ label: item.label, value: item.value });
        }
      }
      resolve(searchResultList);
    }
  });
};

export function runSearch(
  search: SearchCallback,
  params: SearchCallbackParams
): Promise<Map<string, QueryNavigation>> {
  return search(params).then(searchResultList => {
    let nextNavigation = new Map();
    for (let result of searchResultList) {
      let proto = params.navigation.get(result.value);
      // We skip unknown results for now.
      if (proto == null) {
        continue;
      }
      nextNavigation.set(proto.value, { ...proto, ...result });
    }
    return nextNavigation;
  });
}
