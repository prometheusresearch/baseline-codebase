import * as q from '../Query';

function strip(query: q.Query, doStrip): q.Query {
  return q.mapQuery(query, query => {
    if (query.name === 'filter') {
      let predicate = q.mapExpression(query.predicate, doStrip);
      return doStrip({...query, predicate});
    } else {
      return doStrip(query);
    }
  });
}

export function stripContext(query) {
  return strip(query, query => ({...query, context: null}));
}

export function stripDomain(query) {
  return strip(query, query => ({...query, context: {type: query.context.type}}));
}

// TODO: remove that by fixing test discovery
test('ok', () => {});
