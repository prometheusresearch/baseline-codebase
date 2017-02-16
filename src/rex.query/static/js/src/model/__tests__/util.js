import * as q from '../Query';

function stripImpl(query: q.Query, doStrip): q.Query {
  if (q.QueryNameSet.has(query.name)) {
    return q.mapQuery(query, query => {
      if (query.name === 'filter') {
        let predicate = q.mapExpression(query.predicate, doStrip);
        return doStrip({...query, predicate});
      } else {
        return doStrip(query);
      }
    });
  } else {
    return q.mapExpression(query, doStrip);
  }
}

export function strip(query) {
  return stripImpl(query, query => ({...query, id: null, context: null}));
}

export function stripId(query) {
  return stripImpl(query, query => ({...query, id: null}));
}

export let stripContext = strip;

export function stripDomain(query) {
  return stripImpl(query, query => ({
    ...query,
    id: null,
    context: {type: query.context.type, hasInvalidType: query.context.hasInvalidType}
  }));
}

// TODO: remove that by fixing test discovery
test('ok', () => {});
