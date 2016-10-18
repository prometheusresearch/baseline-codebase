import * as q from '../Query';

export function stripContext(query: q.Query): q.Query {
  return q.map(query, query => {
    return {
      ...query,
      context: null,
    };
  });
}

// TODO: remove that by fixing test discovery
test('ok', () => {});
