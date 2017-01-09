import * as q from '../Query';
import {is, make, select, trace, root, rebase, move, prev} from '../QueryPointer';

describe('make()', function() {

  it('allows creating things', function() {
    let p = make(q.navigate('individual'));
    expect(p.query).toEqual(q.navigate('individual'));
    expect(p.path).toEqual([]);
    expect(prev(p)).toEqual(null);
  });

});

describe('select()', function() {

  it('selects from the root', function() {
    let p = make(q.pipeline(q.navigate('individual')));

    let p1 = select(p, ['pipeline', 0]);

    expect(p1.query).toEqual(q.navigate('individual'));
    expect(p1.path).toEqual([['pipeline', 0]]);
    expect(prev(p1)).toEqual(p);
  });

  it('selects from the pointer', function() {
    let p = make(q.pipeline(q.def('a', q.navigate('individual'))));

    let p1 = select(p, ['pipeline', 0]);
    let p2 = select(p1, ['binding', 'query']);

    expect(p2.query).toEqual(q.navigate('individual'));
    expect(p2.path).toEqual([['pipeline', 0], ['binding', 'query']]);
    expect(prev(p2)).toEqual(p1);
    expect(prev(p1)).toEqual(p);
  });

});

describe('root()', function() {

  it('gets the root of the pointer', function() {
    let p = make(q.pipeline(q.def('a', q.navigate('individual'))));
    let p1 = select(p, ['pipeline', 0]);
    let p2 = select(p1, ['binding', 'query']);
    expect(root(p)).toEqual(p);
    expect(root(p1)).toEqual(p);
    expect(root(p2)).toEqual(p);
  });

});

describe('trace()', function() {

  it('gets the trace of the pointer', function() {
    let p = make(q.pipeline(q.def('a', q.navigate('individual'))));
    let p1 = select(p, ['pipeline', 0]);
    let p2 = select(p1, ['binding', 'query']);
    expect(trace(p)).toEqual([p]);
    expect(trace(p1)).toEqual([p, p1]);
    expect(trace(p2)).toEqual([p, p1, p2]);
  });

});

describe('rebase()', function() {

  it('rebases pointer onto new query', function() {
    let query = q.pipeline(q.def('a', q.navigate('individual')))
    let nextQuery = q.pipeline(q.def('a', q.navigate('individual')))

    let p = make(query);
    let p1 = select(p, ['pipeline', 0]);
    let p2 = select(p1, ['binding', 'query']);
    expect(p2.query).toBe(query.pipeline[0].binding.query);
    expect(prev(p2)).toBeTruthy();
    expect(prev(prev(p2))).toBeTruthy();
    expect(prev(prev(prev(p2)))).toBeNull();

    let rp2 = rebase(p2, nextQuery);
    expect(rp2.query).toBe(nextQuery.pipeline[0].binding.query);
    expect(prev(rp2)).toBeTruthy();
    expect(prev(prev(rp2))).toBeTruthy();
    expect(prev(prev(prev(rp2)))).toBeNull();
  });

});

describe('move()', function() {

  it('moves pointer to next item in pipeline', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.navigate('name')
    );

    let p = select(make(query), ['pipeline', 0]);
    expect(p.query).toEqual(q.navigate('individual'));

    let pp1 = move(p, 1);
    expect(pp1.query).toEqual(q.navigate('name'));
    expect(pp1.path).toEqual([['pipeline', 1]]);

    let pm1 = move(pp1, -1);
    expect(pm1.query).toEqual(q.navigate('individual'));
    expect(pm1.path).toEqual([['pipeline', 0]]);
  });

});

test('is()', function() {
  let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
  expect(is(make(query), make(query))).toBeTruthy();
  expect(is(make(query, ['pipeline', 0]), make(query))).toBeFalsy();
  expect(is(make(query, ['pipeline', 0]), make(query, ['pipeline', 0]))).toBeTruthy();
});
