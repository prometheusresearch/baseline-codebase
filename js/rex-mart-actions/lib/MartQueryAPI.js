/**
 * @copyright 2017, Prometheus Research, LLC
 */

import {serializeQuery} from 'rex-query/api';

export default class MartQueryAPI {
  constructor(insert, update) {
    this._insert = insert;
    this._update = update;
  }

  insert({martID, query, chartList, title}) {
    if (this._insert == null) {
      throw new Error('MartQueryAPI is not configured for inserts');
    }
    return this._insert.execute({
      mart: martID,
      title: sanitizeTitle(title),
      data: {query: serializeQuery(query), chartList},
    });
  }

  update({id, query, chartList, title}) {
    if (this._update == null) {
      throw new Error('MartQueryAPI is not configured for updates');
    }
    return this._update.execute({
      id,
      title: sanitizeTitle(title),
      data: {query: serializeQuery(query), chartList},
    });
  }
}

function sanitizeTitle(title) {
  return title.replace(/\s+$/, '').replace(/^\s+/, '');
}
