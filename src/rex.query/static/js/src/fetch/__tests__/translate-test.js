/**
 * @flow
 */

import * as c from '../../model/RexQueryCatalog';

import {
  here,
  navigate,
  aggregate,
  pipeline,
  filter,
  def,
  select,
  group,
  less,
  value,
  or,
  not,
  inferType,
} from '../../model/Query';
import translate from '../translate';

import _catalog from '../../model/__tests__/catalog.json';

let catalog: c.Catalog = _catalog;
let domain = c.toDomain(catalog);

describe('translate', function() {
  it('study', function() {
    let query = inferType(domain, navigate('study'));
    expect(translate(query)).toEqual(['navigate', 'study']);
  });

  it('study.code', function() {
    let query = inferType(domain, pipeline(navigate('study'), navigate('code')));
    expect(translate(query)).toEqual(['.', ['navigate', 'study'], ['navigate', 'code']]);
  });

  it('study.sample.code', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), navigate('sample'), navigate('code')),
    );
    expect(translate(query)).toEqual([
      '.',
      ['.', ['navigate', 'study'], ['navigate', 'sample']],
      ['navigate', 'code'],
    ]);
  });

  it('study.code:count()', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), navigate('code'), aggregate('count')),
    );
    expect(translate(query)).toEqual([
      'count',
      ['.', ['navigate', 'study'], ['navigate', 'code']],
    ]);
  });

  it('study.filter(code)', function() {
    let query = inferType(domain, pipeline(navigate('study'), filter(navigate('code'))));
    expect(translate(query)).toEqual([
      'filter',
      ['navigate', 'study'],
      ['navigate', 'code'],
    ]);
  });

  it('study.filter(code < 42)', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), filter(less(navigate('code'), value(42)))),
    );
    expect(translate(query)).toEqual([
      'filter',
      ['navigate', 'study'],
      ['<', ['navigate', 'code'], 42],
    ]);
  });

  it('study.filter(code < 42 or !is_invalid)', function() {
    let query = inferType(
      domain,
      pipeline(
        navigate('study'),
        filter(or(less(navigate('code'), value(42)), not(navigate('is_invalid')))),
      ),
    );
    expect(translate(query)).toEqual([
      'filter',
      ['navigate', 'study'],
      ['|', ['<', ['navigate', 'code'], 42], ['!', ['navigate', 'is_invalid']]],
    ]);
  });

  it('study.sample.code:count()', function() {
    let query = inferType(
      domain,
      pipeline(
        navigate('study'),
        navigate('sample'),
        navigate('code'),
        aggregate('count'),
      ),
    );
    expect(translate(query)).toEqual([
      'count',
      ['.', ['.', ['navigate', 'study'], ['navigate', 'sample']], ['navigate', 'code']],
    ]);
  });

  it('study.sample.code:count() (embedded path)', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), navigate('sample'), aggregate('count', 'code')),
    );
    expect(translate(query)).toEqual([
      'count',
      ['.', ['.', ['navigate', 'study'], ['navigate', 'sample']], ['navigate', 'code']],
    ]);
  });

  it('study.group(code)', function() {
    let query = inferType(domain, pipeline(navigate('study'), group(['code'])));
    expect(translate(query)).toEqual([
      'group',
      ['navigate', 'study'],
      ['navigate', 'code'],
    ]);
  });

  it('study.define(name := code)', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), def('name', pipeline(navigate('code')))),
    );
    expect(translate(query)).toEqual([
      'define',
      ['navigate', 'study'],
      ['=>', 'name__regular', ['navigate', 'code']],
      ['=>', 'name', ['navigate', 'name__regular']],
    ]);
  });

  it('study.select(code := code)', function() {
    let query = inferType(
      domain,
      pipeline(navigate('study'), select({code: pipeline(navigate('code'))})),
    );
    expect(translate(query)).toEqual([
      'select',
      ['navigate', 'study'],
      ['=>', 'code', ['navigate', 'code']],
    ]);
  });

  it('study.select(code := code) limit 100', function() {
    let query = inferType(
      domain,
      pipeline(here, select({customer: pipeline(navigate('customer'))})),
    );
    expect(translate(query, {limitSelect: 100})).toEqual([
      'select',
      ['here'],
      ['=>', 'customer', ['take', ['navigate', 'customer'], 100]],
    ]);
  });
});
