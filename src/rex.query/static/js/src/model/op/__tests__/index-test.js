import {def, pipeline, navigate, select} from '../../Query';
import * as qp from '../../QueryPointer';
import {insertAfter, removeAt} from '../index';

describe('insertAfter()', function() {

  it('individual!name', function() {
    let query = navigate('individual');
    let pointer = qp.make(query);
    let {query: nextQuery} = insertAfter({pointer, selected: null}, navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('[individual]!name', function() {
    let query = pipeline(navigate('individual'));
    let pointer = qp.make(query);
    let {query: nextQuery} = insertAfter({pointer, selected: null}, navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual.sample!name', function() {
    let query = pipeline(navigate('individual'), navigate('sample'));
    let pointer = qp.make(query);
    let {query: nextQuery} = insertAfter({pointer, selected: null}, navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!sample.name', function() {
    let query = pipeline(navigate('individual'), navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = insertAfter({pointer, selected: null}, navigate('sample'));
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a = sample!name)', function() {
    let query = pipeline(
      navigate('individual'),
      def('a', navigate('sample'))
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = insertAfter({pointer, selected: null}, navigate('name'));
    expect(nextQuery).toMatchSnapshot();
  });

});

describe('removeAt()', function() {

  it('individual.name!', function() {
    let query = pipeline(navigate('individual'), navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 1]);
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual!.name', function() {
    let query = pipeline(navigate('individual'), navigate('name'));
    let pointer = qp.select(qp.make(query), ['pipeline', 0]);
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!)', function() {
    let query = pipeline(
      navigate('individual'),
      select({
        a: pipeline(navigate('sample'), navigate('name'))
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = [sample!])', function() {
    let query = pipeline(
      navigate('individual'),
      select({
        a: pipeline(navigate('sample')),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a'],
      ['pipeline', 0]
    );
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:select(a = sample.name!, b = sample)', function() {
    let query = pipeline(
      navigate('individual'),
      select({
        a: pipeline(navigate('sample'), navigate('name')),
        b: navigate('sample'),
      })
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['select', 'a']
    );
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

  it('individual:define(a := sample!)', function() {
    let query = pipeline(
      navigate('individual'),
      def('a', pipeline(navigate('sample'))),
    );
    let pointer = qp.select(
      qp.make(query),
      ['pipeline', 1],
      ['binding', 'query']
    );
    let {query: nextQuery} = removeAt({pointer, selected: null});
    expect(nextQuery).toMatchSnapshot();
  });

});

