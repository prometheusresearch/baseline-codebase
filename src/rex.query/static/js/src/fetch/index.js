/**
 * @flow
 */

import type {Query, Domain} from '../model';
import type {Catalog} from '../model/RexQueryCatalog';

import download from 'downloadjs';

import {toDomain} from '../model/RexQueryCatalog';
import translate from './translate';

function fetchJSON(api: string, data: mixed): Promise<Object> {
  return window.fetch(api, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  }).then(response => response.json());
}

export function initiateDownload(api: string, query: Query): Promise<Blob> {
  return window.fetch(api, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'text/csv',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(translate(query)),
  })
  .then(response => response.blob())
  .then(blob => download(blob, 'query.csv', 'text/csv'));
}

export function fetch(api: string, query: Query): Promise<Object> {
  return fetchJSON(api, translate(query));
}

export function fetchCatalog(api: string): Promise<Domain> {
  return fetchJSON(api, ['catalog']).then(data => {
    let catalog: Catalog = data;
    return toDomain(catalog);
  });
}
