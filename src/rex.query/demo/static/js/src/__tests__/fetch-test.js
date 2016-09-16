
import {navigate, aggregate, pipeline} from '../model/Query';
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


});
