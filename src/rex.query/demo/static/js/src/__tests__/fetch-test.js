
import {navigate, aggregate, pipeline, filter, def} from '../model/Query';
import {translate} from '../fetch';

describe('translate', function() {

  it('study', function() {
    let query = navigate('study');
    expect(translate(query)).toEqual(
      ['navigate', 'study']);
  });

  it('study.code', function() {
    let query = pipeline(navigate('study'), navigate('code'));
    expect(translate(query)).toEqual(
      ['.',
        ['navigate', 'study'],
        ['navigate', 'code']]);
  });

  it('study.sample.code', function() {
    let query = pipeline(navigate('study'), navigate('sample'), navigate('code'));
    expect(translate(query)).toEqual(
      ['.',
        ['.', ['navigate', 'study'], ['navigate', 'sample']],
        ['navigate', 'code']]);
  });

  it('study.code:count()', function() {
    let query = pipeline(navigate('study'), navigate('code'), aggregate('count'));
    expect(translate(query)).toEqual(
      ['count',
        ['.',
          ['navigate', 'study'],
          ['navigate', 'code']]]);
  });

  it('study.filter(code)', function() {
    let query = pipeline(
      navigate('study'),
      filter(navigate('code'))
    );
    expect(translate(query)).toEqual(
      ['filter',
        ['navigate', 'study'],
        true
      ]
    );
  });

  it('study.sample.code:count()', function() {
    let query = pipeline(
      navigate('study'),
      navigate('sample'),
      navigate('code'),
      aggregate('count')
    );
    expect(translate(query)).toEqual(
      ['count',
        ['.',
          ['.', ['navigate', 'study'], ['navigate', 'sample']],
          ['navigate', 'code']]]);
  });

  it('study.define(name := code)', function() {
    let query = pipeline(
      navigate('study'),
      def('name', navigate('code')),
    );
    expect(translate(query)).toEqual(
      ['define',
        ['navigate', 'study'],
        ['=>',
          'name',
          ['navigate', 'code']]
      ]);
  });


});
