import * as q from '../Query';
import * as qp from '../QueryPointer';
import * as qo from '../QueryOperation';

describe('insertAfter()', function() {

  it('individual!name', function() {
    let query = q.navigate('individual');
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter(pointer, null, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('[individual]!name', function() {
    let query = q.pipeline(q.navigate('individual'));
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter(pointer, null, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual.sample!name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('sample'));
    let pointer = qp.make(query);
    let {query: nextQuery} = qo.insertAfter(pointer, null, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!sample.name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = qo.insertAfter(pointer, null, q.navigate('sample'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a = sample!name)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.def('a', q.navigate('sample'))
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = qo.insertAfter(pointer, null, q.navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

});

describe('removeAt()', function() {

  it('individual.name!', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 1]);
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!.name', function() {
    let query = q.pipeline(q.navigate('individual'), q.navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample'), q.navigate('name'))
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = [sample!])', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample')),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a'],
      ['pipeline', 0]
    );
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!, b = sample)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.select({
        a: q.pipeline(q.navigate('sample'), q.navigate('name')),
        b: q.navigate('sample'),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a := sample!)', function() {
    let query = q.pipeline(
      q.navigate('individual'),
      q.def('a', q.pipeline(q.navigate('sample'))),
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = qo.removeAt(pointer, null);
    expect(nextQuery).toMatchSnapshot();
  });

});
